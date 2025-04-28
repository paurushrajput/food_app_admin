const RestaurantsModel = require("../../models/mysql/restaurants.model");
const SlotsModel = require("../../models/mysql/slots.model.js");
const GeneralError = require("../../error/generalError");
const ClientError = require("../../error/clientError");
const { getKeyByValue } = require("../../utils/general");
const { RestaurantStatus, ReservationTrackStatus, BookingTrackStatus, FilterCondnType, Status, Bit, RESTAURANT_TYPE } = require("../../constants/database");
const SlotModel = require("../../models/mysql/slots.model");
const ReservationModel = require("../../models/mysql/reservation.model");
const { isEmptyField, getTrimmedValue } = require("../../utils/common");
const { Pagination } = require("../../constants/database");
const { formatDate, getServerDateTime, getDateTimeObj } = require("../../utils/moment.js");
const MESSAGES = require('../../constants/messages.js');
const { ADMIN_USERS } = require("../../constants/appConfig.js");
const AppConfig = require("../../models/mysql/appconfig.model.js");
const MerchantsModel = require("../../models/mysql/merchants.model.js");

class RestaurantService {
  static async changeRestaurantStatus(data) {
    const { status, res_id } = data;
    let [restaurant] = await RestaurantsModel.findRestaurantById(res_id);
    if (!restaurant) {
      throw new ClientError('Invalid Restaurant Id');
    }
    if (status === restaurant.status) {
      throw new ClientError(`Restaurant's current status is already ${getKeyByValue(RestaurantStatus, Number(restaurant.status))}`);
    }
    const { rows } = await RestaurantsModel.updateOneById({ status: RestaurantStatus[status] }, restaurant.id);
    if (rows != 1) {
      throw new ServerError('Something went wrong while updating user status. Please try again');
    }
    return {
      msg: `Restaurants status updated successfully to ${status}`
    }
  }

  static async autoBookingStatus(data) {
    const { auto_booking, res_id } = data;
    let restaurant = await RestaurantsModel.findRestaurantById(res_id);
    if (!restaurant || restaurant.length < 1) {
      throw new ClientError('Invalid restaurant_id');
    }
    restaurant = restaurant[0];
    const pendingStatus = ReservationTrackStatus.find(elem => elem.key == 'pending')?.value;
    const [pendingBooking] = await ReservationModel.getPendingBookingCount(restaurant.id, pendingStatus);
    if (pendingBooking.count > 0) {
      throw new ClientError(`Merchant has ${pendingBooking.count} booking in pending status. Please clear them first`);
    }
    const { rows } = await RestaurantsModel.updateOneById({ auto_booking: auto_booking }, restaurant.id);
    if (rows != 1) {
      throw new ServerError('Something went wrong while updating restaurant auto booking accept status');
    }
    return {
      msg: `Restaurants auto booking updated successfully`
    }
  }

  static async updateInfo(data) {
    const {
      res_id,
      commission_base_price,
      commission_advance,
      commission_currency,              //default 'AED'
      commission_type,                  //default percent
      /*commission_settled, 
      /*last_payment*/
      approve,
      status,
      reject_reason,
      deactivate_reason,
      auto_booking,
      booking_fee_required,
      is_pilot,
      pax_commission_type,
      pax_details,
      on_boarded_by,
      approved_by,
      live_by,
      pilot_by,
      restaurant_type,
      enable_instant_payment,
      instant_pay_amt_pct,
      rev_msg_template,
      voucher_applicable,
      otp_required,
      credits_applicable
    } = data;

    let [restaurant] = await RestaurantsModel.findRestaurantById(res_id);
    if (!restaurant) {
      throw new ClientError('Invalid Restaurant Id');
    }

    const updateObj = {};
    const otherDetails = {};

    if (!isEmptyField(commission_base_price)) {
      updateObj.commission_base_price = Number(commission_base_price);
      updateObj.commission_advance = Number(commission_base_price);
    }

    if (!isEmptyField(voucher_applicable)) {
      updateObj.voucher_applicable = Number(voucher_applicable);
    }

    if (!isEmptyField(credits_applicable)) {
      updateObj.credits_applicable = Number(credits_applicable);
    }

    if (!isEmptyField(pax_commission_type)) {
      updateObj.pax_commission_type = Number(pax_commission_type);
      if (isEmptyField(pax_details)) {
        throw new ClientError(MESSAGES.RESTAURANTS.PAX_DETAILS_REQUIRED)
      } else if (Object.keys(pax_details).length > Bit.one) {
        throw new ClientError(MESSAGES.RESTAURANTS.PAX_KEY_LIMIT)
      }
    }
    if (!isEmptyField(pax_details)) {
      updateObj.pax_details = pax_details;
    }

    // if (!isEmptyField(is_pilot) && Number(is_pilot) == Bit.one && Number(restaurant.is_pilot) == Bit.zero) {
    //   throw new ClientError(`Cannot make live restaurant to pilot`);
    // }

    if (!isEmptyField(is_pilot) && is_pilot == Bit.one) {
      if (isEmptyField(pilot_by)) throw new ClientError("pilot_by is required")
    }

    if (!isEmptyField(is_pilot) && is_pilot == Bit.zero) {
      if (isEmptyField(live_by)) throw new ClientError("live_by is required")
    }

    const [adminUsers] = await AppConfig.getAppConfigByTitle(ADMIN_USERS);
    let validAdminVals = [];
    if (adminUsers) {
      validAdminVals = Object.values(adminUsers.value[0]);
    }

    if (!isEmptyField(on_boarded_by) && isEmptyField(restaurant?.on_boarded_by)) {
      if (!validAdminVals.includes(on_boarded_by)) {
        throw new ClientError("on_boarded_by admin users does not exists")
      }
      updateObj.on_boarded_by = Number(on_boarded_by);
    }

    if (!isEmptyField(approved_by) && isEmptyField(restaurant?.approved_by)) {
      if (!validAdminVals.includes(approved_by)) {
        throw new ClientError("approved_by admin users does not exists")
      }
      updateObj.approved_by = Number(approved_by);
    }

    if (!isEmptyField(restaurant_type)) {
      // if (!isEmptyField(restaurant.type)) throw new ClientError("Restaurant type cannot be updated more than once")
      updateObj.type = Number(restaurant_type);
    }

    // if (!isEmptyField(on_boarded_by)) updateObj.on_boarded_by = Number(on_boarded_by);
    // if (!isEmptyField(approved_by)) updateObj.approved_by = Number(approved_by);
    if (!isEmptyField(live_by)) updateObj.live_by = Number(live_by);
    if (!isEmptyField(pilot_by)) updateObj.pilot_by = Number(pilot_by);

    if (!isEmptyField(commission_advance)) updateObj.commission_advance = Number(commission_advance);
    if (!isEmptyField(commission_currency)) updateObj.commission_currency = commission_currency;
    if (!isEmptyField(commission_type)) updateObj.commission_type = commission_type;
    if (!isEmptyField(booking_fee_required)) updateObj.booking_fee_required = booking_fee_required;
    if (!isEmptyField(approve)) {
      if (Number(restaurant.is_approved) === Bit.one /* && Number(approve) === Bit.zero*/) {
        throw new ClientError('Restaurant is already approved');
      }
      if (Number(approve) === Bit.zero) {
        if (isEmptyField(reject_reason)) {
          throw new ClientError(MESSAGES?.REJECT_REASON)
        }
        // updateObj.other_details = { ...restaurant.other_details, reject_reason }
        otherDetails.reject_reason = reject_reason;
      }
      if (Number(approve) === Bit.one) await RestaurantService.checkRestDetails(res_id, Number(restaurant_type));
      updateObj.is_approved = Number(approve);
    }

    if (!isEmptyField(auto_booking)) {
      const [pendingBooking] = await ReservationModel.getPendingBookingCount(restaurant.id, BookingTrackStatus.pending);
      if (pendingBooking.count > 0) {
        throw new ClientError(`Merchant has ${pendingBooking.count} booking in pending status. Please clear them first`);
      }
      updateObj.auto_booking = Number(auto_booking)
    };
    if (!isEmptyField(status)) {
      const statusValue = RestaurantStatus[status];
      // const statusValue = getKeyByValue(RestaurantStatus, Number(restaurant.status))
      if (statusValue === restaurant.status) {
        throw new ClientError(`Restaurant's current status is already ${status}`);
      }
      if (statusValue === RestaurantStatus.inactive) {
        if (isEmptyField(deactivate_reason))
          throw new ClientError('Deactivate reason is required');
        // updateObj.other_details = { ...restaurant.other_details, deactivate_reason }
        otherDetails.deactivate_reason = deactivate_reason;
      }
      if (statusValue === RestaurantStatus.active) {
        // updateObj.other_details = { ...restaurant.other_details, deactivate_reason: "" }
        otherDetails.deactivate_reason = "";

      }

      updateObj.status = statusValue;
    };
    if (!isEmptyField(is_pilot)) {
      updateObj.is_pilot = is_pilot;
      if (Number(updateObj.is_pilot) == 0) {
        //update the resturant pilot at when restaurant goes live
        RestaurantsModel.updateOneById({ pilot_at: getServerDateTime() }, restaurant.id);
      }
    }
    if (!isEmptyField(rev_msg_template)) {
      updateObj.rev_msg_template = rev_msg_template;
      // const { rows } = await SlotsModel.updateByColumn({ rev_msg_template: rev_msg_template }, 'res_id', restaurant.id);
    }

    if (!isEmptyField(enable_instant_payment)) {
      updateObj['is_instant_payment'] = enable_instant_payment;
    }

    if (!isEmptyField(instant_pay_amt_pct)) {
      updateObj['instant_pay_amt_pct'] = instant_pay_amt_pct;
    }

    if (!isEmptyField(is_pilot) && is_pilot == Bit.zero) {
      if (isEmptyField(live_by)) throw new ClientError("live_by is required")
    }

    if (!isEmptyField(otp_required)) {
      otherDetails.otp_required = Number(otp_required);
    }

    if (Object.keys(otherDetails).length) {
      updateObj.other_details = { ...restaurant.other_details, ...otherDetails }
    }

    const { rows } = await RestaurantsModel.updateOneById(updateObj, restaurant.id);
    if (rows != 1) {
      throw new ServerError('Something went wrong while updating restaurant');
    }

    return {
      msg: `Restaurant updated successfully`
    }
  }

  static async getReviewsDetailsList(data) {
    let {
      page,
      page_size,
      is_paginated,
      sort_by,
      order,
      keyword,
      from_date,
      to_date,
      id,
      type,
      user,
    } = data;

    if (isEmptyField(sort_by)) sort_by = 'created_at';
    if (isEmptyField(order)) order = 'desc';
    if (isEmptyField(page)) page = 1;
    if (isEmptyField(page_size)) page_size = 10;
    if (getTrimmedValue(is_paginated) === "false") is_paginated = false;
    else is_paginated = true;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const response = await RestaurantsModel.getRestaurantReviewsDetailsList({
      sort,
      limit,
      offset,
      is_paginated,
      keyword,
      from_date,
      to_date,
      id,
      type,
    });

    response.rows = response?.rows?.map(el => ({
      id: el.id,
      name: el.name,
      email: el.email,
      avg_rating: Number(el.reviews?.avg_rating || 0),
      review_count: Number(el.reviews?.review_count || 0),
      review_reply_count: Number(el.reviews?.review_reply_count || 0),
      pending_reply_count: Number(el.reviews?.review_count || 0) - Number(el.reviews?.review_reply_count || 0),
    })) || []

    return {
      count: response?.count || 0,
      rows: response?.rows || []
    };
  }

  static async getReviewsDetails(data) {
    let {
      res_id,
      user,
    } = data;

    let [restaurant] = await RestaurantsModel.findRestaurantById(res_id);
    if (!restaurant) {
      throw new ClientError('Invalid restaurant_id');
    }

    const [response] = await RestaurantsModel.getRestaurantReviewsDetails(restaurant.id);

    if (!response) {
      throw new ClientError('No review details found');
    }

    response.avg_rating = Number(response?.avg_rating || 0);
    response.review_count = Number(response?.review_count || 0);
    response.review_reply_count = Number(response?.review_reply_count || 0);
    response.pending_reply_count = Number(response?.review_count || 0) - Number(response?.review_reply_count || 0);

    return {
      rows: response
    };
  }

  /**
  * list slots
  * @param {string} body - pagination values.
  */
  static async getSlots(body) {
    let {
      page = 1,
      page_size = 10,
      is_paginated = true,
      sort_by = 'created_at',
      order = 'desc',
      keyword,
      from_date,
      to_date,
      day,
      month,
      year,
      res_id,
      id,
      type,
      user,
    } = body;

    let from_date_slots = from_date;
    if (isEmptyField(sort_by)) sort_by = Pagination.defaultSortColumn;
    if (isEmptyField(order)) order = Pagination.defaultOrder;
    if (isEmptyField(page)) page = Pagination.defaultPage;
    if (isEmptyField(page_size)) page_size = Pagination.pageSize;
    if (getTrimmedValue(is_paginated) === "false") is_paginated = false;
    else is_paginated = true;
    if (isEmptyField(from_date)) from_date_slots = formatDate(new Date());

    // const sort = `${sort_by} ${order}`;
    const sort = `st.date ${order}, st.start_time  ${order}`;
    // const sort = `st.date desc, st.start_time desc`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    let [restaurant] = await RestaurantsModel.findRestaurantById(res_id);
    if (!restaurant) {
      throw new ClientError('Invalid Restaurant ID');
    }

    const [bookingCountResult] = await RestaurantsModel.getBookingCounts({ res_id: restaurant.id, filter: FilterCondnType.byDate, from_date, to_date });

    const response = await RestaurantsModel.listSlots({
      sort,
      limit,
      offset,
      keyword,
      is_paginated,
      from_date: from_date_slots,
      to_date,
      id,
      type,
      res_id: restaurant.id,
      day,
      month,
      year,
    })

    // response.rows = response?.rows?.map(el=>({...el, image: getUrlFromBucket(el.image)})) || []

    return {
      reservatinos: {
        upcoming_booking_count: bookingCountResult?.upcoming_booking_count || 0,
        completed_booking_count: bookingCountResult?.completed_booking_count || 0,
        cancelled_booking_count: bookingCountResult?.cancelled_booking_count || 0,
        total_booking_count: bookingCountResult?.total_booking_count || 0,
        noshow_booking_count: bookingCountResult?.noshow_booking_count || 0,
        accepted_booking_count: bookingCountResult?.accepted_booking_count || 0,
      },
      count: response?.count || 0,
      rows: response?.rows.map(el => ({ ...el, date: formatDate(el.date, 'DD-MMM-YY') })) || []
    };
  }

  /**
   * restaurant get details handler
   * @param {string} body - res_uid(optional).
   */
  static async checkRestDetails(resId, restType) {
    const [rest] = await RestaurantsModel.getRestaurantDetails({
      column: "r.uid",
      value: resId
    });


    if (!rest) {
      throw new ClientError('Restaurant Not Found');
    }

    if (rest.type == RESTAURANT_TYPE.DEAL || restType == RESTAURANT_TYPE.DEAL) {
      if (isEmptyField(rest.name))
        throw new ClientError('Restaurant name is missing');
      if (isEmptyField(rest.email))
        throw new ClientError('Restaurant email is missing');
      if (isEmptyField(rest.address) || isEmptyField(rest.coordinates))
        throw new ClientError('Restaurant address is missing');
      if (isEmptyField(rest.pin_code))
        throw new ClientError('Restaurant pin code is missing');
      if ((isEmptyField(rest.country_code) || isEmptyField(rest.phone)) && (isEmptyField(rest.landline_country_code) || isEmptyField(rest.landline)))
        throw new ClientError('Restaurant contact details are missing');

      return;
    }

    if (isEmptyField(rest.name))
      throw new ClientError('Restaurant name is missing');
    if (isEmptyField(rest.email))
      throw new ClientError('Restaurant email is missing');
    if (isEmptyField(rest.address) || isEmptyField(rest.coordinates))
      throw new ClientError('Restaurant address is missing');
    if (isEmptyField(rest.pin_code))
      throw new ClientError('Restaurant pin code is missing');
    if ((isEmptyField(rest.country_code) || isEmptyField(rest.phone)) && (isEmptyField(rest.landline_country_code) || isEmptyField(rest.landline)))
      throw new ClientError('Restaurant contact details are missing');
    if (isEmptyField(rest.category) || rest.category < 1)
      throw new ClientError('Restaurant cuisines are missing');
    if (isEmptyField(rest.amenities) || rest.amenities < 1)
      throw new ClientError('Restaurant amenities are missing');
    if (isEmptyField(rest.slots) || rest.slots < 1)
      throw new ClientError('Restaurant slots are missing');
    if (isEmptyField(rest.image_urls?.menu_images) || !rest.image_urls?.menu_images.length)
      throw new ClientError('Restaurant menu images are missing');
    if (isEmptyField(rest.image_urls?.restaurant_images) || !rest.image_urls?.restaurant_images.length)
      throw new ClientError('Restaurant images are missing');
    if (isEmptyField(rest.image_urls?.logo_images) || !rest.image_urls?.logo_images.length)
      throw new ClientError('Restaurant logo images are missing');
    if (isEmptyField(rest.operational_hours))
      throw new ClientError('Restaurant Operational hours are missing');
    if (Number(rest.commission_base_price) < Number(rest.commission_advance))
      throw new ClientError('Restaurant Total commission cannot be less than Advance commission');

    return;
    // return {
    //   id: rest.uid,
    //   name: rest.name,

    //   country_code: rest.country_code || "",
    //   phone: rest.phone,

    //   landline_country_code: rest.landline_country_code || "",
    //   landline_std_code: rest.landline_std_code || "",
    //   landline: rest.landline || "",

    //   email: rest.email,
    //   is_mobile_verified: rest.is_mobile_verified,
    //   is_email_verified: rest.is_email_verified,

    //   merchant: rest.merchant,

    //   coordinates: rest.coordinates,
    //   address: rest.address,
    //   gps_address: rest.gps_address,
    //   pin_code: rest.pin_code,
    //   country: rest.country,
    //   city: rest.city,
    //   location: rest.location,

    //   icon: rest.icon,
    //   menu_special_condn: rest?.other_details?.menu_special_condn,
    //   menu_images: rest.image_urls.menu_images,
    //   res_images: rest.image_urls.restaurant_images,
    //   logo_images: rest.image_urls.logo_images,

    //   about: rest.about,
    //   policy: rest.policy,

    //   is_approved: rest.is_approved,

    //   category: rest.category,
    //   amenities: rest.amenities,
    //   slots: rest.slots,

    //   total_seats: rest.total_seats,
    //   total_restaurant_capacity: rest.total_restaurant_capacity,
    //   max_guest_per_slot: rest.max_guest_per_slot || MaxGuestPerSlot,
    //   max_guest_per_booking: rest.max_guest_per_booking || MaxGuestPerBooking,

    //   auto_booking: rest?.auto_booking || 0,
    // };
  }

  static async getRestaurantsByMerchant(data) {
    const { merchant_id } = data;

    let [merchant] = await MerchantsModel.getMerchantByColumn({ column: 'uid', value: merchant_id });
    if (!merchant) {
      throw new ClientError("Merchant not found")
    }

    const restaurants = await MerchantsModel.findAllRestaurantsByMerchants(merchant.id);

    return {
      restaurants
    };
  }

  static async updateSlots(data) {
    const { slots, restaurant_id, dbTransaction } = data;

    const [isRestaurantExist] = await RestaurantsModel.findActiveRestaurantByColumn({ column: 'uid', value: restaurant_id });

    if (!isRestaurantExist) {
      throw new ClientError('Restaurant not found');
    }

    const status = ReservationTrackStatus?.filter(elem =>
      elem.key == 'approved' ||
      elem.key == 'payment_completed' ||
      elem.key == 'arrived' ||
      elem.key == 'pending' ||
      elem.key == 'payment_pending' ||
      elem.key == 'noshow'
    )?.map(elm => elm.value);

    for (let slot of slots) {
      const { start_date, end_date, start_time, end_time, otp_required, rev_msg_template, max_guest_per_booking, discount, voucher_applicable, booking_fee_required, auto_booking, amount, total_capacity, commission_type
      } = slot;
      const existingSlots = await SlotsModel.findSlotAndBookingDetailsByStartAndEndDate(isRestaurantExist.id, start_date, end_date, start_time, end_time, status, dbTransaction);
      const dateRange = `${start_date} ${start_time} - ${end_date} ${end_time}`

      if (!existingSlots || existingSlots?.length < 1) {
        throw new ClientError(`Slot does not exists for ${dateRange}`)
      }

      for (let existingSlot of existingSlots) {
        const { date, start_time, end_time, booking_details = [], other_details = {}, pax_details = {}, id } = existingSlot
        const dateRange = `${date} ${start_time} - ${date} ${end_time}`
        if (!isEmptyField(booking_details) && booking_details.length > 0) {
          throw new ClientError(`Reservation exists for slot date ${dateRange}`)
        }

        const updateObj = {}

        const otherDetails = other_details || {};

        updateObj['other_details'] = otherDetails;

        if (!isEmptyField(otp_required)) {
          updateObj['otp_required'] = otp_required;
        }

        if (!isEmptyField(rev_msg_template)) {
          updateObj['rev_msg_template'] = rev_msg_template;
        }

        if (!isEmptyField(max_guest_per_booking)) {
          updateObj['max_guest_per_booking'] = max_guest_per_booking;
        }

        if (!isEmptyField(discount)) {
          updateObj['discount'] = discount;
        }

        if (!isEmptyField(total_capacity)) {
          updateObj['seats_allocated'] = total_capacity;
          updateObj['seats_left'] = total_capacity;
        }

        if (!isEmptyField(voucher_applicable)) {
          updateObj['voucher_applicable'] = voucher_applicable;
        }

        if (!isEmptyField(booking_fee_required)) {
          updateObj['other_details']['booking_fee_required'] = booking_fee_required;
        }

        if (!isEmptyField(auto_booking)) {
          updateObj['other_details']['auto_booking'] = auto_booking;
        }

        if (!isEmptyField(amount)) {
          const existingPaxDetails = pax_details || {};
          updateObj['pax_details'] = existingPaxDetails;
          updateObj['pax_details']['fixed_per_pax'] = amount;
        }

        if (!isEmptyField(commission_type)) {
          updateObj['pax_commission_type'] = commission_type;
        }

        if (Object.keys(updateObj).length < 1) {
          throw new ClientError(`No data to update for slots ${id}`)
        }

        const { rows } = await SlotsModel.updateOneByID(updateObj, id, dbTransaction);
        if (rows < 1) {
          throw new ClientError(`Unable to update for slots ${dateRange}`)
        }
      }
    }

    return {
      msg: 'Slots updated successfully'
    }
  }
}

module.exports = RestaurantService;
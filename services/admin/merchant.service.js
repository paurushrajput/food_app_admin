require("dotenv").config();
const MerchantsModel = require("../../models/mysql/merchants.model");
const RestaurantsModel = require("../../models/mysql/restaurants.model");
const GeneralError = require("../../error/generalError");
const ClientError = require("../../error/clientError");
const { getUrlFromBucket } = require("../../utils/s3");
const MediaModel = require("../../models/mysql/media.model");
const { getKeyByValue } = require("../../utils/general");
const { MerchantStatus, ReservationTrackStatus, RestaurantStatus, RESTAURANT_PAX_DETAILS, Bit, RESTAURANT_LIST_TYPE, RESTAURANT_TYPE } = require("../../constants/database");
const LocationModel = require("../../models/mysql/location.model");
const CategoryModel = require("../../models/mysql/category.model");
const { createJwt } = require("../../utils/jwt");
const { SuperAdminPrefix } = require("../../constants/variables");
const { updateCompleteToken } = require("../../utils/userToken");
const { getData, delData } = require("../../dbConfig/redisConnect");
const AdminAuthModel = require("../../models/mysql/admin.model");
const { successCode } = require("../../constants/statusCode");
const { isEmptyField, getTrimmedValue } = require("../../utils/common");
const { getDateTimeObj } = require("../../utils/moment");
const AppConfig = require("../../models/mysql/appconfig.model");
const { ADMIN_USERS, ADMIN_LOGIN_MERCHANT } = require("../../constants/appConfig");
const ServerError = require("../../error/serverError");
const AdminLoginModel = require("../../models/mysql/adminLogin.model");

class MerchantService {

  static async getMerchants(data) {
    const {
      page = 1,
      page_size = 10,
      sort_by = 'created_at',
      is_paginated = true,
      order = 'desc',
      merchant_type = null,
      keyword = null,
    } = data;
    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const response = await MerchantsModel.getMerchantList({ sort, offset, limit, is_paginated, merchant_type, keyword });
    return {
      count: response.count,
      rows: await Promise.all(
        response.rows?.map(async elem => {
          const merchantSession = await getData(elem.id) || [];
          return {
            ...elem,
            login_count: merchantSession?.length || 0,
          }
        })
      ),
    };
  }

  static async getRestaurantsByMerchantId(body) {
    const { merchantId } = body;
    const getIdByUId = await MerchantsModel.findMerchantWithUId(merchantId);
    console.log(getIdByUId[0].id);
    const merchnatRes = await MerchantsModel.findMerchantRestaurant(getIdByUId[0].id);
    return merchnatRes;
  }

  static async getRestaurants(data) {
    let {
      page = 1,
      page_size = 10,
      is_paginated,
      sort_by = 'created_at',
      order = 'desc',
      keyword,
      from_date,
      to_date,
      restaurant_type = null,
      loc_id = null,
      cat_id = null,
      mer_id = null,
      approval_status,
      is_pilot,
      res_status,
      type = RESTAURANT_LIST_TYPE.DEFAULT
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

    let location_id;
    let category_id;
    if (loc_id) {
      const [getLocationId] = await LocationModel.getOneByuId(loc_id);
      if (!getLocationId || getLocationId.length < 1) {
        throw new ClientError('Invalid Location id provided');
      }
      location_id = getLocationId.id;
    }
    if (cat_id) {
      const [getCategoryId] = await CategoryModel.getOneByuId(cat_id);
      if (!getCategoryId || getCategoryId.length < 1) {
        throw new ClientError('Invalid Location id provided');
      }
      category_id = getCategoryId.id;
    }
    const status = ReservationTrackStatus.find(elem => elem.key == 'payment_completed')
    const [adminUsers] = await AppConfig.getAppConfigByTitle(ADMIN_USERS);
    const response = await MerchantsModel.getRestaurantList({
      sort,
      offset,
      limit,
      is_paginated,
      restaurant_type,
      keyword,
      from_date,
      to_date,
      location_id,
      category_id, // Add location_id if loc_id exists
      mer_id,
      status: Number(status.value),
      approval_status,
      is_pilot: !isEmptyField(is_pilot) ? Number(is_pilot) : null,
      res_status,
      type
    });

    return {
      admin_users: adminUsers?.value || [],
      count: response?.count,
      restaurant_pax_details: RESTAURANT_PAX_DETAILS,
      rows: response?.rows?.map(el => ({
        id: el.id,
        name: el.name,
        email: el.email,
        phone: el.phone,
        address: el.address,
        coordinates: el.coordinates,
        total_seats: el.total_seats,
        cousines: el.cousines,
        location_name: el.location_name,
        icon: el.icon,
        about: el.about,
        enable_instant_payment: el.enable_instant_payment,
        instant_pay_amt_pct: el.instant_pay_amt_pct,
        auto_booking: el.auto_booking,
        is_pilot: el.is_pilot,
        pilot_at: getDateTimeObj(el.created_at, true),
        live_at: getDateTimeObj(el.pilot_at, true),
        booking_fee_required: el.booking_fee_required,
        pax_commission_type: el.pax_commission_type,
        pax_details: el.pax_details,
        // on_boarded_by: !isEmptyField(el.on_boarded_by) ? getKeyByValue(adminUsers?.value[0], el.on_boarded_by): el.on_boarded_by,
        // approved_by: !isEmptyField(el.approved_by) ? getKeyByValue(adminUsers?.value[0], el.approved_by): el.approved_by,
        // live_by: !isEmptyField(el.live_by) ? getKeyByValue(adminUsers?.value[0], el.live_by): el.live_by,
        // pilot_by: !isEmptyField(el.pilot_by) ? getKeyByValue(adminUsers?.value[0], el.on_boarded_by): el.on_boarded_by,
        on_boarded_by: el.on_boarded_by,
        approved_by: el.approved_by,
        live_by: el.live_by,
        pilot_by: el.on_boarded_by,
        booking: {
          ...el.booking,
          revenue: Number(el?.booking?.revenue) || 0,
          // total_guest: Number(el?.booking?.total_guest) || 0,
          total_commission: Number(el?.booking?.total_commission) || 0,
          commission_settled: Number(el.commission_settled) || 0,
          commission_due: Number(el?.booking?.total_commission || 0) - Number(el?.commission_settled || 0),
          // cancelled_booking_count: Number(el?.cancelled_booking_count) || 0,
          // total_booking_count: Number(el?.total_booking_count) || 0,
          // noshow_booking_count: Number(el?.noshow_booking_count) || 0,
          total_seats_allocated: Number(el?.seats_allocated) || 0,
        },
        last_payment: {
          amount: Number(el?.last_payment?.amount) || 0,
          payment_date: Number(el?.last_payment?.payment_date) || 0,
          create_at: Number(el?.last_payment?.create_at) || 0,
        },
        merchant: {
          ...el.merchant,
        },
        // reviews: {
        //   ...el.reviews,
        //   avg_rating: Number(el?.reviews?.avg_rating) || 0,
        //   review_count: Number(el?.reviews?.review_count) || 0,
        //   review_reply_count: Number(el?.reviews?.review_reply_count) || 0,
        // },
        approval_status: el.approval_status,
        status: getKeyByValue(RestaurantStatus, Number(el.status)) || "",
        deactivate_reason: el.status === RestaurantStatus.inactive ? (el?.other_details?.deactivate_reason || "") : "",
        commission_base_price: el.commission_base_price,
        commission_advance: el.commission_advance,
        commission_currency: el.commission_currency,
        commission_type: el.commission_type,
        reject_reason: el?.other_details?.reject_reason || "",
        restaurant_type: el?.type,
        type: getKeyByValue(RESTAURANT_TYPE, Number(el?.type)) || "",
        rev_msg_template: el.rev_msg_template,
        voucher_applicable: el.voucher_applicable,
        otp_required: el.other_details?.otp_required,
        credits_applicable: el?.credits_applicable ?? ''
      })) || []
    };
  }

  static async updateMerchant(data) {
    const {
      mer_id,
      force_update_pass,
      email,
      country_code,
      mobile
    } = data;

    let [merchant] = await MerchantsModel.getMerchantByColumn({ column: 'uid', value: mer_id });
    if (!merchant)
      throw new ClientError('Invalid Merchant Id');

    const updateObj = {};
    if (!isEmptyField(force_update_pass)) {
      updateObj.force_update_pass = Number(force_update_pass);
    }

    if (!isEmptyField(email)) {
      updateObj.email = getTrimmedValue(email)
    }

    if (!isEmptyField(country_code) && !isEmptyField(mobile)) {
      updateObj.country_code = country_code;
      updateObj.mobile = mobile;
    }

    const { rows } = await MerchantsModel.updateOneById(updateObj, merchant.id);
    if (!isEmptyField(force_update_pass)) {
      await delData(merchant.uid)
    }

    if (rows != 1) {
      throw new ServerError('Something went wrong while updating merchant');
    }
    return {
      msg: `Updated successfully`
    }
  }

  static async restaurantDetails(data) {
    const { restaurant_id } = data;

    const [restaurant] = await RestaurantsModel.findRestaurantDetails(restaurant_id);
    if (!restaurant || restaurant.length < 1) {
      throw new ClientError('Invalid restaurant_id')
    }
    const allMenu = await MediaModel.getAllByIds(restaurant.menu);
    restaurant.menu = allMenu?.map(menu => `${menu.basePath}/${menu.filename}`)

    return {
      ...restaurant,
      menu: restaurant?.menu?.map(m => (getUrlFromBucket(m)))
    };
  }

  static async restaurantApproval(data) {
    const { restaurant_id, approve } = data;
    const [isRestaurantExist] = await RestaurantsModel.findActiveRestaurantByColumn({ column: 'uid', value: restaurant_id });
    if (!isRestaurantExist) {
      throw new ClientError('Restaurant Not Found');
    }

    if (isRestaurantExist.is_approved != null) {
      throw new ClientError(Number(isRestaurantExist.is_approved) == 1 ? 'Restaurant is already approved' : 'Restaurant is already rejected');
    }

    const { rows } = await RestaurantsModel.updateOneById({
      is_approved: approve,
    }, isRestaurantExist.id);

    if (rows != 1) {
      throw new GeneralError('An error occurred while approving restaurant. Please try again.');
    }

    return {
      msg: Number(approve) == 1 ? 'Restaurant approved successfully' : 'Restaurant rejected successfully',
    }
  }

  static async changeMerchantStatus(data) {
    const { status, mer_id } = data;
    let merchant = await MerchantsModel.findMerchantWithUId(mer_id);
    if (!merchant || merchant.length < 1) {
      throw new ClientError('Invalid merchant_id');
    }
    merchant = merchant[0];
    const merchantCurrentStatus = getKeyByValue(MerchantStatus, Number(merchant.status));
    if (String(status) == merchantCurrentStatus) {
      throw new ClientError(`Merchant's current status is already ${status}`);
    }
    const { rows } = await MerchantsModel.updateOneById({ status: MerchantStatus[status] }, merchant.id);
    if (rows != 1) {
      throw new ServerError('Something went wrong while updating user status. Please try again');
    }
    return {
      msg: `Merchant status updated successfully to ${status}`
    }
  }

  static async getMerchantAccessToken(data) {
    const { merchant_id, user, ip_address, request_header, dbTransaction } = data;

    // //check if incoming user ip is allowed in app config
    // const [appConfig] = await AppConfig.getAppConfigByTitle(ADMIN_LOGIN_MERCHANT);
    // if (!appConfig) {
    //   throw new ServerError(`WhiteList ip entry not found in appConfig with title ${ADMIN_LOGIN_MERCHANT}`);
    // }

    // const whiteListApi = Object.values(appConfig?.value || {});
    // if (whiteListApi.length < 1) {
    //   throw new ServerError("No Ip has been whitelisted");
    // }

    // if (!whiteListApi.includes(ip_address)) {
    //   throw new ClientError("You're not authorized to access this");
    // }

    const [merchant] = await MerchantsModel.findMerchantDetailsForLogin(merchant_id, dbTransaction);
    if (!merchant) {
      throw new ClientError("Merchant not found", { statusCode: successCode })
    }

    if (merchant?.status == Bit.zero) {
      throw new ClientError("Merchant's account is deactivated", { statusCode: successCode })
    }

    const [restaurant] = await RestaurantsModel.getLatestRestaurantByMerchant(merchant.id);
    if (!restaurant) {
      throw new ClientError("Restaurant not found", { statusCode: successCode })
    }

    if (restaurant?.status == Bit.zero) {
      throw new ClientError("Restaurant's is deactivated", { statusCode: successCode })
    }

    const uid = `${SuperAdminPrefix}${merchant.uid}`;

    //check if any superadmin has already login for this merchant
    const redisUserData = await getData(uid);
    if (redisUserData) {
      const [adminUser] = await AdminAuthModel.getAdminById(user, dbTransaction);
      throw new ClientError(`A super admin with email "${adminUser.email}" has already login for this merchant`, { statusCode: successCode });
    }

    //Fetching ttl from environment variables
    const ttl = process.env.REDIS_TTL_FOR_MERCHANT_ACCESS_TOKEN;
    if (!ttl) {
      throw new ServerError("REDIS_TTL_FOR_MERCHANT_ACCESS_TOKEN not found in environment variable");
    }

    //Generating user token for given merchant;
    const _user = { uid, admin: user };
    const jwtSecretMerchantAccessToken = process.env.JWT_SECRET_FOR_ADMIN_ACCESS_TOKEN;
    if (!jwtSecretMerchantAccessToken) {
      throw new ServerError("JWT_SECRET_FOR_ADMIN_ACCESS_TOKEN not found in environment variable");
    }
    const token = await createJwt(_user, jwtSecretMerchantAccessToken);
    _user['merchant'] = merchant;
    _user['ip_address'] = ip_address;
    //storing token in redis
    await updateCompleteToken(_user, token, ttl);

    //tracking admin login record
    const adminLogins = {
      admin_id: user,
      merchant_id: merchant.id,
      ip_address,
      token,
      request_header
    }

    const { rows } = await AdminLoginModel.insert(adminLogins, dbTransaction);
    if (rows < 1) {
      throw new ServerError("Unable to generate access token")
    }

    return {
      merchant_id,
      access_token: token,
    };
  }

}

module.exports = MerchantService;
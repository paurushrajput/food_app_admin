const ReservationModel = require("../../models/mysql/reservation.model");
const RestaurantsModel = require("../../models/mysql/restaurants.model");
const PaymentsModel = require("../../models/mysql/payments.model");
const RefundsModel = require("../../models/mysql/refunds.model.js");
const SlotModel = require("../../models/mysql/slots.model.js");
const CouponsModel = require("../../models/mysql/coupons.model");
const CouponRedeemModel = require("../../models/mysql/couponRedeem.model");
const UserCouponModel = require("../../models/mysql/userCoupons.model.js");
const ClientError = require("../../error/clientError");
const { Bit, BookingCancelType, ReservationTrackStatus, BookingTrackStatus, Pagination } = require("../../constants/database");
const { isEmptyField, getTrimmedValue, formatDecimal, getKeyByValue, isEmpty } = require("../../utils/common.js");
const { PaymentModes, PaymentStatus, TelrGatewayRefundUrl, RefundAuthKey, StoreId } = require("../../constants/payments");
const { post } = require("../../utils/fetch");
const { BookingFeeRefund } = require("../../constants/notification");
var { parseString } = require('xml2js');
const util = require("util");
const NotificationMaster = require("../../models/mysql/notificationMaster.model.js");
const { NotificationImageType, hourInSeconds } = require("../../constants/variables");
const readXml = util.promisify(parseString);
const { sendPushNotificationToDevice } = require("../../utils/pushNotification");
const { NOTIFICATION_TEMPLATE_KEYWORD } = require("../../constants/notificationTemplate");
const NotificationTemplateService = require("./notificationTemplate.service.js");
const { getDateOnly, datetimeToTz, currentDateTimeToTz } = require("../../utils/moment");
const ServerError = require("../../error/serverError.js");
const UserWalletModel = require("../../models/mysql/userWallet.model.js");

class ReservationService {
  static async getReservationListByRestaurant(body) {
    let {
      page,
      page_size,
      is_paginated,
      sort_by,
      order,
      keyword,
      from_date,
      to_date,
      res_uid,
      reservation_id,
      booking_type,
      location_id,
      is_nukhba_user,
      res_name,
      type,
      is_pilot,
      booking_id,
      campaign_code,
      coupon_code,
      coupon_discount,
      reservation_discount,
      user_email_mobile,
      coupon_applied,
    } = body;

    if (isEmptyField(sort_by)) sort_by = Pagination.defaultSortColumn;
    if (isEmptyField(order)) order = Pagination.defaultOrder;
    if (isEmptyField(page)) page = Pagination.defaultPage;
    if (isEmptyField(page_size)) page_size = Pagination.pageSize;
    if (getTrimmedValue(is_paginated) === "false") is_paginated = false;
    else is_paginated = true;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const response = await ReservationModel.list({
      sort,
      limit,
      offset,
      keyword,
      is_paginated,
      from_date,
      to_date,
      booking_type,
      reservation_id,
      res_id: res_uid,
      location_id,
      is_nukhba_user,
      res_name,
      type,
      is_pilot: !isEmptyField(is_pilot) ? Number(is_pilot) : null,
      booking_id,
      campaign_code,
      coupon_code,
      coupon_discount,
      reservation_discount,
      user_email_mobile,
      coupon_applied,
    })

    const result = response?.rows?.map(el => {
      const resTrackStatusObj = ReservationTrackStatus.find(rts => rts.value === el.status);
      let statusObj = JSON.parse(JSON.stringify(resTrackStatusObj || {}))
      if (statusObj.value === BookingTrackStatus.rejected_by_admin && el.payment_status === PaymentStatus.refunded.key) {
        statusObj.text = PaymentStatus.refunded.text;
      }

      return {
        id: el.uid,
        name: el.name || "",
        user_email: el.email || "",
        user_mobile: el.phone || "",
        user_id: el.user_id,
        user_status: el.user_status,
        is_nukhba_user: el.is_nukhba_user || 0,
        total_guest: Number(el.total_guest) || 0,
        username: el.username?.trim(),
        actual_guest_arrived: Number(el.actual_guest_arrived) || '',
        commission: Number(el.commission) || 0,
        commission_base_price: Number(el.commission_base_price) || '',
        booking_fee: Number(el.user_advance_payment) || '',
        commission_currency: el.commission_currency || '',
        discount: Number(el.discount) || 0,
        coupon_amount: isEmptyField(el?.coupon_amount) ? null : Number(el.coupon_amount),
        coupon_discount: isEmptyField(el?.coupon_discount) ? null : Number(el.coupon_discount),
        coupon_code: el?.coupon_code || null,
        campaign_code: el?.campaign_code || null,
        res_name: el.res_name,
        cancel_reason: el.cancel_reason || "",
        cancel_type: el.cancel_type || "",
        status: { text: statusObj.text, value: statusObj.value, key: statusObj.key },
        scheduled_at: el.scheduled_at,
        booking_date: el.booking_date,
        payment_status: el.payment_status,
        refund_ref_id: el.refund_ref_id
      }
    }) || [];
    return {
      count: response.count,
      rows: result,
    };
  }

  /**
   * cancel a reservation
   * @param {string} body
   */
  static async cancelReservation(body) {
    let {
      reserve_ids,
      booking_cancel_type,
      booking_cancel_reason,
      user,   //admin id
      dbTransaction
    } = body;

    reserve_ids = reserve_ids.split(",");
    const reservationNotFoundArr = [];
    const reservationNotInCancelStatusArr = [];
    const refundFailedResArr = [];
    const reservations = [];
    for (let reserve_id of reserve_ids) {
      let [reservationExist] = await ReservationModel.findReservationById(reserve_id, dbTransaction);

      //check if reservation exist
      if (!reservationExist) {
        // throw new ClientError('Reservation not found');
        reservationNotFoundArr.push(reserve_id);
        continue;
      }

      // check if reservation is in approve/pending/active status, only these can be cancelled
      if (reservationExist.status !== BookingTrackStatus.active && reservationExist.status !== BookingTrackStatus.pending && reservationExist.status !== BookingTrackStatus.approved) {
        reservationNotInCancelStatusArr.push(reserve_id);
        continue;
      }

      reservations.push(reservationExist);
    }

    if (reservationNotFoundArr.length) {
      const reservationNotFound = reservationNotFoundArr.join(",")
      throw new ClientError(`Following Reservation not found: ${reservationNotFound}`);
    } else if (reservationNotInCancelStatusArr.length) {
      const reservationNotInCancelStatus = reservationNotInCancelStatusArr.join(",")
      throw new ClientError(`Following Reservation cannot be cancelled: ${reservationNotInCancelStatus}`);
    }

    const { title, message, image } = await NotificationTemplateService.getNotificationDetailsByKeyword(NOTIFICATION_TEMPLATE_KEYWORD.BOOKING_FEE_REFUND, dbTransaction);

    for (let reservationExist of reservations) {

      //within 2 hours cancel
      if (new Date(reservationExist.booking_start).getTime() - new Date().getTime() < 0) {
        throw new ClientError(`Cannot cancel the booking since this booking time has passed`);
      }

        // refund amount till 2 hours of created_at reservation time
        const bookingTime = datetimeToTz(reservationExist?.created_at)
        const bookingTimeInMilli = new Date(bookingTime).getTime()
        const currentTime = currentDateTimeToTz()
        const currentTimeInMilli = new Date(currentTime).getTime()
        const timeDiff = currentTimeInMilli - bookingTimeInMilli
        if( timeDiff > 2 * hourInSeconds * 1000){
          throw new ClientError(`Reservation can be cancelled only within 2 hours of booking time`);
        }

      // update reservation
      const reservationUpdateObj = {
        is_cancelled: Bit.one,
        cancel_type: BookingCancelType.OTHERS,
        cancel_reason: booking_cancel_reason,
        status: BookingTrackStatus.rejected_by_admin
      }
      const resUpdate = await ReservationModel.updateOneByID(reservationUpdateObj, reservationExist.id, dbTransaction)

      //update slots
      if (resUpdate.rows && reservationExist.status === BookingTrackStatus.approved) {
        let new_seats_left = Number(reservationExist.seats_left) + Number(reservationExist.total_guest);
        await SlotModel.updateOneByID({ seats_left: Number(new_seats_left) }, reservationExist.slot_id, dbTransaction);
      }

      //update payment status and refund amount
      const [paymentExist] = await PaymentsModel.getOneByColumns({
        columns: ['reservation_id'],
        values: [reservationExist.id]
      }, dbTransaction);
      if (paymentExist && paymentExist.status === PaymentStatus.completed.value) {

        // revert the credits back to user
        const nukhba_credits_used = Number(paymentExist?.nukhba_credits_used) || 0
        const actual_refundable = paymentExist?.amount
        let refundable_amount = paymentExist?.actual_amount
        if(nukhba_credits_used > 0){
          refundable_amount = refundable_amount -  nukhba_credits_used 
        }
        if(!isEmpty(reservationExist?.coupon_redeem_id)){
          const [couponRes] = await CouponRedeemModel.getCouponRedeemById(reservationExist?.coupon_redeem_id,dbTransaction)
          if(!isEmpty(couponRes?.amount) && couponRes?.amount > 0 ){
              refundable_amount = refundable_amount -  couponRes?.amount 
          }
        }

        refundable_amount = refundable_amount.toFixed(2)

        if(refundable_amount != actual_refundable ){
          throw new ClientError('Refunable amount and actual refundable not matching.')
        }

        let refundResult 

        // refund
        if(actual_refundable > 0){
          const payload = `<?xml version="1.0" encoding="UTF-8"?><remote><store>${StoreId}</store><key>${RefundAuthKey}</key><tran><type>refund</type><class>ecom</class><currency>${paymentExist.currency}</currency><amount>${actual_refundable}</amount><ref>${paymentExist.other_details.tran_ref}</ref><test>1</test></tran></remote>`;
          refundResult = await post({ url: TelrGatewayRefundUrl, body: payload, headers: { contentType: 'application/xml' } });
          if (!refundResult?.data) {
            refundFailedResArr.push(reservationExist.id);
            continue;
          }

          refundResult = await readXml(refundResult?.data);

          await RefundsModel.insert({
            user_id: reservationExist.user_id,
            transaction_id: paymentExist.id,
            amount: paymentExist.actual_refundable,
            currency: paymentExist.currency,
            other_details: { reservation_id: reservationExist.id },
            payment_mode: PaymentModes.online,
            ref_txn_id: refundResult?.remote?.auth[0]?.tranref[0]
          }, dbTransaction);

        }
        const updatePaymentObj = { status: PaymentStatus.refunded.value }
        await PaymentsModel.updateOneById(updatePaymentObj, paymentExist.id, dbTransaction);

        const notificationObj = {
          title: title,
          message: message,
          user_id: reservationExist.user_id,
          image_url: image
        }
        NotificationMaster.insert(notificationObj, dbTransaction);
        sendPushNotificationToDevice(
          {
            title,
            message,
            fcmToken: reservationExist?.fcm_token,
            type: NotificationImageType.WITHOUT_IMAGE,
          }
        )
      }

    }

    return { msg: 'Reservation cancelled successfully' };
  }

  static async getMetrics(body = {}) {
    let { from_date, to_date, res_id, user_id, log_date, is_nukhba_user, is_pilot = Bit.zero } = body;
    let result = {};

    if (isEmptyField(from_date)) from_date = getDateOnly();
    if (isEmptyField(to_date)) to_date = getDateOnly();
    if (isEmptyField(log_date)) log_date = getDateOnly();

    const statusDataAllPromise = ReservationModel.getTotalStatusCount(null, is_nukhba_user, is_pilot);
    const statusDataOfTodayPromise = ReservationModel.getTotalStatusCount(log_date, is_nukhba_user, is_pilot);

    const bookingRateDailyPromise = ReservationModel.getBookingPercentageOfTotalVisits(log_date, false, is_nukhba_user, is_pilot);
    const uniqueBookingRateDailyPromise = ReservationModel.getBookingPercentageOfTotalVisits(log_date, true, is_nukhba_user, is_pilot);
    const uniqueBookingUserPromise = ReservationModel.getUniqueResUser(log_date, true, is_nukhba_user, is_pilot);
    const getActiveUserTodayPromise = ReservationModel.getActiveUserToday(log_date, true, is_nukhba_user, is_pilot);

    // const dailyAverageRevenuePerUserPromise = ReservationModel.getAverageRevenuePerUser(log_date)

    const cartAbandonedPromise = ReservationModel.getCartAbandoned(log_date, is_nukhba_user, is_pilot);

    const userPerTransactionPromise = ReservationModel.getUserPerTransaction(log_date, is_nukhba_user, is_pilot);

    const totalVoucherPromise = CouponsModel.getTotalVoucher(log_date);
    const totalVoucherAmountPromise = CouponsModel.getVoucherTotalAmount(log_date, is_nukhba_user, is_pilot);
    const totalRedeemCouponPromise = CouponsModel.getTotalVoucherAmountRedeemed(log_date, is_nukhba_user, is_pilot);
    const totalUnusedCouponPromise = CouponsModel.getUnusedCoupon(log_date, is_nukhba_user, is_pilot);
    const totalExpiredCouponPromise = CouponsModel.getExpiredCoupon(log_date);

    const avgRevenuePerUserPromise = ReservationModel.avgRevenuePerUser({ from_date, to_date, is_nukhba_user, is_pilot });
    const avgTransactionValuePromise = ReservationModel.avgTransactionValue({ from_date, to_date, is_nukhba_user, is_pilot });
    const totalBookingFeeReceivedPromise = ReservationModel.totalBookingFeeReceived({ from_date, to_date, is_nukhba_user, is_pilot });
    const revenueDataPromise = ReservationModel.revenueData({ from_date, to_date, res_id, is_nukhba_user, is_pilot });
    const totalReferralsPromise = ReservationModel.totalReferrals({ from_date, to_date, user_id, is_nukhba_user, is_pilot });

    const promises = [
      statusDataAllPromise,
      statusDataOfTodayPromise,
      bookingRateDailyPromise,
      uniqueBookingRateDailyPromise,
      uniqueBookingUserPromise,
      getActiveUserTodayPromise,
      cartAbandonedPromise,
      userPerTransactionPromise,
      totalVoucherPromise,
      totalVoucherAmountPromise,
      totalRedeemCouponPromise,
      totalUnusedCouponPromise,
      totalExpiredCouponPromise,
      avgRevenuePerUserPromise, avgTransactionValuePromise, totalBookingFeeReceivedPromise, revenueDataPromise, totalReferralsPromise
    ]
    const [
      statusDataAll,
      statusDataOfToday,
      [bookingRateDaily],
      [uniqueBookingRateDaily],
      [uniqueBookingUser],
      [getActiveUserToday],
      [cartAbandoned],
      [userPerTransaction],
      [totalVoucher],
      [totalVoucherAmount],
      [totalRedeemCoupon],
      [totalUnusedCoupon],
      [totalExpiredCoupon],
      [avgRevenuePerUser] = [],
      [avgTransactionValue] = [],
      [totalBookingFeeReceived] = [],
      [revenueData] = [],
      [totalReferrals] = []
    ] = await Promise.all(promises);

    result['status_count'] = {
      all_booking: {
        active: statusDataAll.find(el => el.status === BookingTrackStatus.active)?.count || 0,
        approved: statusDataAll.find(el => el.status === BookingTrackStatus.approved)?.count || 0,
        arrived: statusDataAll.find(el => el.status === BookingTrackStatus.arrived)?.count || 0,
        payment_completed: statusDataAll.find(el => el.status === BookingTrackStatus.payment_completed)?.count || 0,
        completed: statusDataAll.find(el => el.status === BookingTrackStatus.completed)?.count || 0,
        deleted: statusDataAll.find(el => el.status === BookingTrackStatus.deleted)?.count || 0,
        rejected: statusDataAll.find(el => el.status === BookingTrackStatus.rejected)?.count || 0,
        cancelled: statusDataAll.find(el => el.status === BookingTrackStatus.cancelled)?.count || 0,
        noshow: statusDataAll.find(el => el.status === BookingTrackStatus.noshow)?.count || 0,
        pending: statusDataAll.find(el => el.status === BookingTrackStatus.pending)?.count || 0,
        booking_not_accepted: statusDataAll.find(el => el.status === BookingTrackStatus.booking_not_accepted)?.count || 0,
        auto_cancelled: statusDataAll.find(el => el.status === BookingTrackStatus.auto_cancelled)?.count || 0,
        payment_pending: statusDataAll.find(el => el.status === BookingTrackStatus.payment_pending)?.count || 0,
        rejected_by_admin: statusDataAll.find(el => el.status === BookingTrackStatus.rejected_by_admin)?.count || 0,
        total: statusDataAll.reduce((accumulator, currentValue) => accumulator + currentValue.count, 0)
      },
      daily_booking: {
        active: statusDataOfToday.find(el => el.status === BookingTrackStatus.active)?.count || 0,
        approved: statusDataOfToday.find(el => el.status === BookingTrackStatus.approved)?.count || 0,
        arrived: statusDataOfToday.find(el => el.status === BookingTrackStatus.arrived)?.count || 0,
        payment_completed: statusDataOfToday.find(el => el.status === BookingTrackStatus.payment_completed)?.count || 0,
        completed: statusDataOfToday.find(el => el.status === BookingTrackStatus.completed)?.count || 0,
        deleted: statusDataOfToday.find(el => el.status === BookingTrackStatus.deleted)?.count || 0,
        rejected: statusDataOfToday.find(el => el.status === BookingTrackStatus.rejected)?.count || 0,
        cancelled: statusDataOfToday.find(el => el.status === BookingTrackStatus.cancelled)?.count || 0,
        noshow: statusDataOfToday.find(el => el.status === BookingTrackStatus.noshow)?.count || 0,
        pending: statusDataOfToday.find(el => el.status === BookingTrackStatus.pending)?.count || 0,
        booking_not_accepted: statusDataOfToday.find(el => el.status === BookingTrackStatus.booking_not_accepted)?.count || 0,
        auto_cancelled: statusDataOfToday.find(el => el.status === BookingTrackStatus.auto_cancelled)?.count || 0,
        payment_pending: statusDataOfToday.find(el => el.status === BookingTrackStatus.payment_pending)?.count || 0,
        rejected_by_admin: statusDataOfToday.find(el => el.status === BookingTrackStatus.rejected_by_admin)?.count || 0,
        // all_cancelled: statusDataOfToday.find(el=> el.status === BookingTrackStatus.cancelled || el.status === BookingTrackStatus.rejected || el.status === BookingTrackStatus.rejected_by_admin)?.count || 0,
        all_cancelled: statusDataOfToday.reduce((accumulator, el) => {
          if (el.status == BookingTrackStatus.cancelled || el.status == BookingTrackStatus.rejected || el.status == BookingTrackStatus.rejected_by_admin) {
            return accumulator + el.count
          }
          return accumulator
        }, 0),
        total: statusDataOfToday.reduce((accumulator, currentValue) => accumulator + currentValue.count, 0)
      },
    }


    result['booking_rate'] = {
      all_booking: formatDecimal(Number(bookingRateDaily.booking_rate)),
      unique_booking: formatDecimal(Number(uniqueBookingRateDaily.unique_booking_rate)),
      unique_booking_user: formatDecimal(Number(uniqueBookingUser.unique_reservation_user)),
      active_user_today: formatDecimal(Number(getActiveUserToday.active_user_today)),
    }

    // result['arpu'] = dailyAverageRevenuePerUser.total_acpu;

    result['cart_abandoned'] = formatDecimal(Number(cartAbandoned.payment_failure_count));

    result['user_per_transaction'] = formatDecimal(Number(userPerTransaction.transaction_count));

    result['vouchers'] = {
      total_active_voucher_count: formatDecimal(Number(totalVoucher.total_active_voucher_count)),
      total_voucher_amount: formatDecimal(Number(totalVoucherAmount.total_voucher_amount)),
      total_voucher_amount_redeemed: formatDecimal(Number(totalRedeemCoupon.total_voucher_amount_redeemed)),
      unused_coupon_count: formatDecimal(Number(totalUnusedCoupon.unused_coupon_count)),
      expired_coupon_count: formatDecimal(Number(totalExpiredCoupon.expired_coupon_count))
    }

    result = {
      ...result,
      avg_revenue_per_user: formatDecimal(Number(avgRevenuePerUser?.avg_revenue_per_user)),
      avg_transaction_value: formatDecimal(Number(avgTransactionValue?.avg_transaction_value)),
      total_booking_fee_received: formatDecimal(Number(totalBookingFeeReceived?.total_booking_fee_received)),
      total_revenue: formatDecimal(Number(revenueData?.total_revenue)),
      avg_revenue_per_booking: formatDecimal(Number(revenueData?.avg_revenue_per_booking)),
      total_referrals: formatDecimal(Number(totalReferrals?.total_referrals)),
    }

    return result;

  }

  static async getTopUsersByReferral(body) {
    let { from_date, to_date, res_id, user_id } = body;

    if (isEmptyField(from_date)) from_date = getDateOnly();
    if (isEmptyField(to_date)) to_date = getDateOnly();

    const result = await ReservationModel.topUsersByReferralCount({});

    return { users: result };

  }

  static async findTotalDiners(currentDate, is_nukhba_user, is_pilot) {
    const res = await ReservationModel.findTotalDiners(currentDate, is_nukhba_user, is_pilot)
    return res[0].total_diners
  }

  static async findTotalUniqueDiners(currentDate, is_nukhba_user, is_pilot) {
    const res = await ReservationModel.findTotalUniqueDiners(currentDate, is_nukhba_user, is_pilot)
    return res[0].total_unique_diners
  }


  static async findActualDiners(currentDate, is_nukhba_user, is_pilot) {
    const res = await ReservationModel.findActualDiners(currentDate, is_nukhba_user, is_pilot)
    return res[0].actual_diners
  }

  static async findFailedTransactions(currentDate, is_nukhba_user, is_pilot) {
    const res = await ReservationModel.findFailedTransactions(currentDate, is_nukhba_user, is_pilot)
    return res[0].failed_transactions
  }

  static async findDailyReservations(currentDate, is_nukhba_user, is_pilot) {
    const res = await ReservationModel.getTotalStatusCount(currentDate, is_nukhba_user, is_pilot);
    let daily_booking = {
      active: res.find(el => el.status === BookingTrackStatus.active)?.count || 0,
      approved: res.find(el => el.status === BookingTrackStatus.approved)?.count || 0,
      arrived: res.find(el => el.status === BookingTrackStatus.arrived)?.count || 0,
      payment_completed: res.find(el => el.status === BookingTrackStatus.payment_completed)?.count || 0,
      completed: res.find(el => el.status === BookingTrackStatus.completed)?.count || 0,
      deleted: res.find(el => el.status === BookingTrackStatus.deleted)?.count || 0,
      rejected: res.find(el => el.status === BookingTrackStatus.rejected)?.count || 0,
      cancelled: res.find(el => el.status === BookingTrackStatus.cancelled)?.count || 0,
      noshow: res.find(el => el.status === BookingTrackStatus.noshow)?.count || 0,
      pending: res.find(el => el.status === BookingTrackStatus.pending)?.count || 0,
      booking_not_accepted: res.find(el => el.status === BookingTrackStatus.booking_not_accepted)?.count || 0,
      auto_cancelled: res.find(el => el.status === BookingTrackStatus.auto_cancelled)?.count || 0,
      payment_pending: res.find(el => el.status === BookingTrackStatus.payment_pending)?.count || 0,
      rejected_by_admin: res.find(el => el.status === BookingTrackStatus.rejected_by_admin)?.count || 0,
      all_cancelled: res.find(el => el.status === BookingTrackStatus.cancelled || el.status === BookingTrackStatus.rejected || el.status === BookingTrackStatus.rejected_by_admin)?.count || 0,
      total: res.reduce((accumulator, currentValue) => accumulator + currentValue.count, 0)
    }
    return daily_booking?.total
  }

  static async mostBookedRestro(validData) {
    const res = await ReservationModel.mostBookedRestro(validData)
    return res
  }

  static async getInstantPaymentList(body) {
    let {
      page = 1,
      page_size = 10,
      is_paginated = true,
      sort_by = 'created_at',
      order = 'desc',
      reservation_id,
      restaurant_id,
      restaurant_name,
      from_date,
      to_date,
      user,
      order_status_code
    } = body;

    if (!sort_by || sort_by === "") sort_by = 'created_at';
    if (!order || order === "") order = 'desc';
    if (!page || page === "") page = 1;
    if (!page_size || page_size === "") page_size = 10;

    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const response = await ReservationModel.listInstantPayment({
      sort_by,
      order,
      offset,
      limit,
      is_paginated,
      reservation_id,
      restaurant_id,
      restaurant_name,
      from_date,
      to_date,
      order_status_code
    })

    const result = response?.rows?.map(el => {

      const returnObj = {
        ...el,
        payment_status: {
          key: getKeyByValue(PaymentStatus, el.payment_status),
          value: el.payment_status,
        },
        payment_details: el?.payment_other_details?.payment_info?.order?.status || {"code": 1, "text": "Pending"},
        txn_details: el?.payment_other_details?.payment_info?.order?.transaction || {},
        user_email: el?.email,
      }

      delete returnObj['payment_other_details']

      return returnObj
    }) || [];

    return {
      count: response.count,
      rows: result,
    }; 
  }
  
  static async resetUserCoupon(userId, couponRedeemId, dbTransaction) {
    const [couponRedeemResult] = await CouponRedeemModel.getCouponRedeemById(couponRedeemId, dbTransaction)
    if (!couponRedeemResult) {
      throw new ClientError("Invalid voucher Id")
    }

    const couponUpdateResult = await CouponRedeemModel.updateOneById({is_used: Bit.zero}, couponRedeemResult.id, dbTransaction)
    // const couponRedeemId = coupon.cpn_assigned_redeem_id;

    const [userCoupon] = await UserCouponModel.findUserCoupon({couponId: couponRedeemResult.coupon_id, userId: couponRedeemResult.user_id}, dbTransaction);
    if (!userCoupon) {
      throw new ClientError("Voucher is not alloted to user")
    }

    await UserCouponModel.updateOneByID({count: Number(userCoupon.count) + 1}, userCoupon.id, dbTransaction);
  }
}

module.exports = ReservationService;
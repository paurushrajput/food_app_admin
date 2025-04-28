const UsersModel = require("../../models/mysql/users.model");
const { formatDate, getDateOnly } = require("../../utils/moment");
const RequestHandler = require("../../utils/requestHandler");
const ReservationService = require("./reservation.service");
const UserAdminService = require("../../services/admin/user.service");
const { roundNumbers, isEmptyField } = require("../../utils/common");
const { Bit, Logins } = require("../../constants/database");
const DealsModel = require("../../models/mysql/deals.model");


class DailyReportService {

  static async dailyReport(validData = {}) {

    const { is_nukhba_user = Bit.zero } = validData;

    const is_pilot = Bit.zero;

    if (!validData?.log_date) {
      const currentDate = formatDate(new Date(), "YYYY-MM-DD");
      validData["log_date"] = currentDate;
    }
    const dailyUsersPromise = UserAdminService.getDailyUsersApi(
      validData?.log_date, is_nukhba_user, is_pilot
    );
    const todaySignupsPromise = UserAdminService.findTodaySignups(
      validData?.log_date, is_nukhba_user, is_pilot
    );
    const totalDinersPromise = ReservationService.findTotalDiners(
      validData?.log_date, is_nukhba_user, is_pilot
    );
    const actualDinersPromise = ReservationService.findActualDiners(
      validData?.log_date, is_nukhba_user, is_pilot
    );
    const uniqueUserBookingPromise = ReservationService.findTotalUniqueDiners(
      validData?.log_date, is_nukhba_user, is_pilot
    );

    const failedTransactionsPromise = ReservationService.findFailedTransactions(
      validData?.log_date, is_nukhba_user, is_pilot
    );

    const findDailyReservationsPromise = ReservationService.findDailyReservations(
      validData?.log_date, is_nukhba_user, is_pilot
    );

    const dealsCreatedPromise = DealsModel.findDealsCreated(validData?.log_date);

    const dealsActivePromise = DealsModel.findActiveDeals();

    const dealsSoldPromise = DealsModel.findSoldDeals(validData?.log_date);

    const dealsRedeemedPromise = DealsModel.findRedeemedDeals(validData?.log_date);

    const [
      dailyUsers,
      todaySignups,
      totalDiners,
      actualDiners,
      uniqueUserBooking,
      failedTransactions,
      findDailyReservations,
      dealsCreated,
      dealsActive,
      dealsSold,
      dealsRedeemed,
    ] = await Promise.all([
      dailyUsersPromise,
      todaySignupsPromise,
      totalDinersPromise,
      actualDinersPromise,
      uniqueUserBookingPromise,
      failedTransactionsPromise,
      findDailyReservationsPromise,
      dealsCreatedPromise,
      dealsActivePromise,
      dealsSoldPromise,
      dealsRedeemedPromise,
    ]);
    const androidUserIds =
      dailyUsers.daily_active_users.android.users.join(",");
    const iosUserIds = dailyUsers.daily_active_users.ios.users.join(",");

    const result = await ReservationService.getMetrics({ from_date: validData?.log_date, to_date: validData?.log_date, log_date: validData?.log_date, is_nukhba_user, is_pilot })
    const metricsDataToSave = {
      tm: {
        daily_booking: {
          active: result.status_count.daily_booking.active,
          approved: result.status_count.daily_booking.approved,
          arrived: result.status_count.daily_booking.arrived,
          payment_completed: result.status_count.daily_booking.payment_completed,
          completed: result.status_count.daily_booking.completed,
          deleted: result.status_count.daily_booking.deleted,
          rejected: result.status_count.daily_booking.rejected,
          cancelled: result.status_count.daily_booking.cancelled,
          noshow: result.status_count.daily_booking.noshow,
          pending: result.status_count.daily_booking.pending,
          booking_not_accepted: result.status_count.daily_booking.booking_not_accepted,
          auto_cancelled: result.status_count.daily_booking.auto_cancelled,
          payment_pending: result.status_count.daily_booking.payment_pending,
          rejected_by_admin: result.status_count.daily_booking.rejected_by_admin,
          total: result.status_count.daily_booking.total,
          all_cancelled: result.status_count.daily_booking.all_cancelled
        },
        booking_rate: {
          all_booking: result.booking_rate.all_booking,
          unique_booking: result.booking_rate.unique_booking,
          unique_booking_user: result.booking_rate.unique_booking_user,
          active_user_today: result.booking_rate.active_user_today,
        },
        cart_abandoned: result.cart_abandoned,
        user_per_transaction: result.user_per_transaction,
        vouchers: {
          total_active_voucher_count: result.vouchers.total_active_voucher_count,
          total_voucher_amount: result.vouchers.total_voucher_amount,
          total_voucher_amount_redeemed: result.vouchers.total_voucher_amount_redeemed,
          unused_coupon_count: result.vouchers.unused_coupon_count,
          expired_coupon_count: result.vouchers.expired_coupon_count
        },
        avg_revenue_per_user: result.avg_revenue_per_user,
        avg_transaction_value: result.avg_transaction_value,
        total_booking_fee_received: result.total_booking_fee_received,
        deals: {
          deals_created: dealsCreated.count,
          deals_active: dealsActive.count,
          deals_sold: dealsSold.total,
          deals_redeemed: dealsRedeemed.count,
        },
      },
      am: {
        total_referrals: result.total_referrals,
      },
      fm: {
        total_revenue: result.total_revenue,
        avg_revenue_per_booking: result.avg_revenue_per_booking,
      },
    }

    let payload = {
      daily_active_users_android: dailyUsers.daily_active_users.android.count,
      daily_active_users_ios: dailyUsers.daily_active_users.ios.count,
      daily_active_users_id_android: androidUserIds,
      daily_active_users_id_ios: iosUserIds,

      log_date: dailyUsers.date,
      daily_signups: todaySignups?.daily_signups || 0,
      total_diners: totalDiners,
      actual_diners: actualDiners,
      other_details: {
        total_vouchers_used: 0,
        total_voucher_value_applied: 0,
        total_unique_users_booking: uniqueUserBooking ?? 0,
        failed_transactions: failedTransactions ?? 0,
        daily_reservations_count: findDailyReservations ?? 0,
        ...todaySignups,
        ...metricsDataToSave
      },
      is_nukhba_user,
    };


    const todayReports = await UsersModel.findDailyReportWithDate(
      payload.log_date, is_nukhba_user
    );
    if (todayReports?.length >= 1) {
      if (validData?.forceUpdate) {
        await UsersModel.DeleteDailyReportWithDate(payload.log_date, is_nukhba_user);
      } else {
        return {
          message: 'Already report  exist.'
        }
      }
    }
    const insertedData = await UsersModel.insertDailyReport(payload);
    return insertedData

  }

  static async getDailyReport(validData = {}) {
    let cumulative = false;
    if (validData?.cumulative) {
      cumulative = true;
    }
    let { from_date, to_date, is_nukhba_user = Bit.zero } = validData;
    // if (isEmptyField(from_date)) from_date = getDateOnly();
    // if (isEmptyField(to_date)) to_date = getDateOnly();
    const allReports = await UsersModel.findAllDailyReport(
      from_date,
      to_date,
      is_nukhba_user,
    );
    let dailyReportData
    let metricsData;
    if (cumulative) {

      let cumulativeReport = {
        daily_active_users_android: 0,
        daily_active_users_ios: 0,
        total_diners: 0,
        actual_diners: 0,
        daily_signups: 0,
        android_signups: 0,
        ios_signups: 0,
        other_details: {
          failed_transactions: 0,
          total_unique_users_booking: 0,
          reservations_count: 0
        },
      };
      metricsData = {
        daily_booking: {
          active: 0,
          approved: 0,
          arrived: 0,
          payment_completed: 0,
          completed: 0,
          deleted: 0,
          rejected: 0,
          cancelled: 0,
          noshow: 0,
          pending: 0,
          booking_not_accepted: 0,
          auto_cancelled: 0,
          payment_pending: 0,
          rejected_by_admin: 0,
          total: 0,
          all_cancelled: 0
        },
        booking_rate: {
          all_booking: 0,
          unique_booking: 0,
          unique_booking_user: 0,
          active_user_today: 0,
        },
        cart_abandoned: 0,
        user_per_transaction: 0,
        vouchers: {
          total_active_voucher_count: 0,
          total_voucher_amount: 0,
          total_voucher_amount_redeemed: 0,
          unused_coupon_count: 0,
          expired_coupon_count: 0,
        },
        avg_revenue_per_user: 0,
        avg_transaction_value: 0,
        total_booking_fee_received: 0,
        total_revenue: 0,
        avg_revenue_per_booking: 0,
        total_referrals: 0,
        deals: {
          deals_created: 0,
          deals_active: 0,
          deals_sold: 0,
          deals_redeemed: 0,
        }
      }

      let cumUniqueDailyAndroidUsers = []
      let cumUniqueDailyIosUsers = []

      for (let i = 0; i < allReports?.length; i++) {
        const item = allReports[i];
        cumUniqueDailyAndroidUsers.push(item.daily_active_users_id_android)
        cumUniqueDailyIosUsers.push(item.daily_active_users_id_ios)

        cumulativeReport = {
          daily_active_users_android:
            cumulativeReport.daily_active_users_android +
            item.daily_active_users_android,

          daily_active_users_ios:
            cumulativeReport.daily_active_users_ios +
            item.daily_active_users_ios,

          total_diners: cumulativeReport.total_diners + item.total_diners,
          actual_diners: cumulativeReport.actual_diners + item.actual_diners,

          // daily_signups: cumulativeReport.daily_signups + item.daily_signups,
          ios_signups: cumulativeReport.ios_signups + Number(item?.other_details?.ios_signups || 0),
          android_signups: cumulativeReport.android_signups + Number(item?.other_details?.android_signups || 0),
          daily_signups: Number(cumulativeReport.ios_signups + Number(item?.other_details?.ios_signups || 0) || 0) + Number(cumulativeReport.android_signups + Number(item?.other_details?.android_signups || 0) || 0),

          other_details: {
            failed_transactions: cumulativeReport.other_details.failed_transactions + item?.other_details?.failed_transactions ?? 0,
            total_unique_users_booking: cumulativeReport.other_details.total_unique_users_booking + item?.other_details?.total_unique_users_booking ?? 0,
            reservations_count: cumulativeReport.other_details.reservations_count + item?.other_details?.daily_reservations_count ?? 0
          }

        };
        metricsData = {
          daily_booking: {
            active: (item?.other_details?.tm?.daily_booking?.active + metricsData?.daily_booking?.active || 0) || 0,
            approved: (item?.other_details?.tm?.daily_booking?.approved + metricsData?.daily_booking?.approved) || 0,
            arrived: (item?.other_details?.tm?.daily_booking?.arrived + metricsData?.daily_booking?.arrived) || 0,
            payment_completed: (item?.other_details?.tm?.daily_booking?.payment_completed + metricsData?.daily_booking?.payment_completed) || 0,
            completed: (item?.other_details?.tm?.daily_booking?.completed + metricsData?.daily_booking?.completed) || 0,
            deleted: (item?.other_details?.tm?.daily_booking?.deleted + metricsData?.daily_booking?.deleted) || 0,
            rejected: (item?.other_details?.tm?.daily_booking?.rejected + metricsData?.daily_booking?.rejected) || 0,
            cancelled: (item?.other_details?.tm?.daily_booking?.cancelled + metricsData?.daily_booking?.cancelled) || 0,
            noshow: (item?.other_details?.tm?.daily_booking?.noshow + metricsData?.daily_booking?.noshow) || 0,
            pending: (item?.other_details?.tm?.daily_booking?.pending + metricsData?.daily_booking?.pending) || 0,
            booking_not_accepted: (item?.other_details?.tm?.daily_booking?.booking_not_accepted + metricsData?.daily_booking?.booking_not_accepted) || 0,
            auto_cancelled: (item?.other_details?.tm?.daily_booking?.auto_cancelled + metricsData?.daily_booking?.auto_cancelled) || 0,
            payment_pending: (item?.other_details?.tm?.daily_booking?.payment_pending + metricsData?.daily_booking?.payment_pending) || 0,
            rejected_by_admin: (item?.other_details?.tm?.daily_booking?.rejected_by_admin + metricsData?.daily_booking?.rejected_by_admin) || 0,
            total: (item?.other_details?.tm?.daily_booking?.total + metricsData?.daily_booking?.total) || 0,
            all_cancelled: (item?.other_details?.tm?.daily_booking?.all_cancelled + metricsData?.daily_booking?.all_cancelled) || 0
          },
          booking_rate: {
            // all_booking: (item?.other_details?.tm?.booking_rate?.all_booking + metricsData?.booking_rate?.booking_rate) || 0,
            unique_booking: (item?.other_details?.tm?.booking_rate?.unique_booking + metricsData?.booking_rate?.unique_booking) || 0,
            unique_booking_user: (item?.other_details?.tm?.booking_rate?.unique_booking_user + metricsData?.booking_rate?.unique_booking_user) || 0,
            active_user_today: (item?.other_details?.tm?.booking_rate?.active_user_today + metricsData?.booking_rate?.active_user_today) || 0,
          },
          cart_abandoned: (item?.other_details?.tm?.cart_abandoned + metricsData?.cart_abandoned) || 0,
          user_per_transaction: (item?.other_details?.tm?.user_per_transaction + metricsData?.user_per_transaction) || 0,
          vouchers: {
            total_active_voucher_count: (item?.other_details?.tm?.vouchers?.total_active_voucher_count + metricsData?.vouchers?.total_active_voucher_count) || 0,
            total_voucher_amount: (item?.other_details?.tm?.vouchers?.total_voucher_amount + metricsData?.vouchers?.total_voucher_amount) || 0,
            total_voucher_amount_redeemed: (item?.other_details?.tm?.vouchers?.total_voucher_amount_redeemed + metricsData?.vouchers?.total_voucher_amount_redeemed) || 0,
            unused_coupon_count: (item?.other_details?.tm?.vouchers?.unused_coupon_count + metricsData?.vouchers?.unused_coupon_count) || 0,
            expired_coupon_count: (item?.other_details?.tm?.vouchers?.expired_coupon_count + metricsData?.vouchers?.expired_coupon_count) || 0,
            used_coupon_count: (Number((item?.other_details?.tm?.vouchers?.total_active_voucher_count + metricsData?.vouchers?.total_active_voucher_count) || 0) - Number((item?.other_details?.tm?.vouchers?.unused_coupon_count + metricsData?.vouchers?.unused_coupon_count) || 0)) || 0,
          },
          avg_revenue_per_user: (item?.other_details?.tm?.avg_revenue_per_user + metricsData?.avg_revenue_per_user) || 0,
          avg_transaction_value: (item?.other_details?.tm?.avg_transaction_value + metricsData?.avg_transaction_value) || 0,
          total_booking_fee_received: (item?.other_details?.tm?.total_booking_fee_received + metricsData?.total_booking_fee_received) || 0,
          total_revenue: (item?.other_details?.fm?.total_revenue + metricsData?.total_revenue) || 0,
          avg_revenue_per_booking: (item?.other_details?.fm?.avg_revenue_per_booking + metricsData?.avg_revenue_per_booking) || 0,
          total_referrals: (item?.other_details?.am?.total_referrals + metricsData?.total_referrals) || 0,
          deals: {
            deals_created: (item?.other_details?.tm?.deals?.deals_created + metricsData?.deals?.deals_created) || 0,
            deals_active: (item?.other_details?.tm?.deals?.deals_active + metricsData?.deals?.deals_active) || 0,
            deals_sold: (Number(item?.other_details?.tm?.deals?.deals_sold) + metricsData?.deals?.deals_sold) || 0,
            deals_redeemed: (item?.other_details?.tm?.deals?.deals_redeemed + metricsData?.deals?.deals_redeemed) || 0,
          },
        }
      }

      // Combine all user IDs into a single array

      let allUserIds = cumUniqueDailyAndroidUsers.join(",").split(",");
      allUserIds = allUserIds.filter(item => item)
      // Remove duplicates and get the unique user IDs
      const uniqueUserIds = new Set(allUserIds);

      // Combine all user IDs into a single array
      let allIosUserIds = cumUniqueDailyIosUsers.join(",").split(",");
      allIosUserIds = allIosUserIds.filter(item => item)
      // Remove duplicates and get the unique user IDs
      const uniqueIosUserIds = new Set(allIosUserIds);

      cumulativeReport.daily_active_users_android = uniqueUserIds.size
      cumulativeReport.daily_active_users_ios = uniqueIosUserIds.size

      dailyReportData =
        cumulativeReport

      // metricsData.booking_rate.unique_booking = (metricsData?.booking_rate?.unique_booking)/(allReports?.length || 1)
      // metricsData.avg_transaction_value = (metricsData?.avg_transaction_value)/(allReports?.length || 1)
      // metricsData.avg_revenue_per_user = (metricsData?.avg_revenue_per_user)/(allReports?.length || 1)

      metricsData.booking_rate.unique_booking = ((metricsData?.booking_rate?.unique_booking_user) / (metricsData?.booking_rate?.active_user_today)) || 0
      metricsData.avg_transaction_value = (metricsData?.total_revenue) / (metricsData?.daily_booking?.approved)
      metricsData.avg_revenue_per_user = (metricsData?.total_revenue) / (cumulativeReport?.total_diners)

    } else {
      const reportsMap = {};
      for (let i = 0; i < allReports?.length; i++) {
        const dateTemp = allReports[i].log_date;
        const formattedDate = formatDate(dateTemp, "YYYY-MM-DD");
        reportsMap[formattedDate] = allReports[i];
        const stored = reportsMap[formattedDate];
        if (stored?.log_date) {
          delete stored.log_date;
        }
      }
      dailyReportData = {
        allReports: reportsMap,
        count: allReports?.length,
      }

    }


    const response = {
      ...dailyReportData,
      ...metricsData
    }

    return roundNumbers(response)
  }

  static async getViewUserList(data) {
    const { from_date, to_date, device_type, is_nukhba_user, page, page_size, is_pagination = true, } = data

    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(limit);

    const allReports = await UsersModel.findAllDailyReport(
      from_date,
      to_date,
      is_nukhba_user,
    );

    if (device_type == Logins.DeviceType.ANDROID) {
      let cumUniqueDailyAndroidUsers = []

      for (let i = 0; i < allReports?.length; i++) {
        const item = allReports[i];
        cumUniqueDailyAndroidUsers.push(item.daily_active_users_id_android)
      }

      // Combine all user IDs into a single array

      let allUserIds = cumUniqueDailyAndroidUsers.join(",").split(",");
      allUserIds = allUserIds.filter(item => item)
      // Remove duplicates and get the unique user IDs
      const uniqueUserIds = new Set(allUserIds);


      const androidUsersPromises = []
      const uniqueUserIdsArray = Array.from(uniqueUserIds);
      for (let i = 0; i < uniqueUserIdsArray.length; i++) {
        androidUsersPromises.push(UsersModel.findUserWithId(uniqueUserIdsArray[i]))
      }

      const androidUsersResult = await Promise.all(androidUsersPromises)
      androidUsersResult?.map((item) => {
        item.is_deleted_user = item.status === Bit.zero
      })

      let androidUsersResultCopy = [...androidUsersResult]
      androidUsersResultCopy = androidUsersResultCopy.slice(offset, offset + limit)

      return { count: androidUsersResult?.length, rows: androidUsersResultCopy, offset, limit }

      // ios
    } else if (device_type == Logins.DeviceType.iOS) {
      let cumUniqueDailyIosUsers = []

      for (let i = 0; i < allReports?.length; i++) {
        const item = allReports[i];
        cumUniqueDailyIosUsers.push(item.daily_active_users_id_ios)
      }

      // Combine all user IDs into a single array
      let allIosUserIds = cumUniqueDailyIosUsers.join(",").split(",");
      allIosUserIds = allIosUserIds.filter(item => item)
      // Remove duplicates and get the unique user IDs
      const uniqueIosUserIds = new Set(allIosUserIds);

      const uniqueIosUserIdsArray = Array.from(uniqueIosUserIds);
      const iosUsersPromises = []
      for (let i = 0; i < uniqueIosUserIdsArray.length; i++) {
        iosUsersPromises.push(UsersModel.findUserWithId(uniqueIosUserIdsArray[i]))
      }
      //

      const iosUsersResult = await Promise.all(iosUsersPromises)

      iosUsersResult?.map((item) => {
        item.is_deleted_user = item.status === Bit.zero
      })

      let iosUsersResultCopy = [...iosUsersResult]
      iosUsersResultCopy = iosUsersResultCopy.slice(offset, offset + limit)

      return { count: iosUsersResult?.length, rows: iosUsersResultCopy, offset, limit }


    }



  }
}


module.exports = DailyReportService;
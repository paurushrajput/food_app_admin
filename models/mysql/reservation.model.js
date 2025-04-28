const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, BookingStatus, Bit, BookingType, Status, ReservationTrackStatus, BookingTrackStatus, FilterCondnType, UserStatus, RESERVATION_TYPE } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common.js");
const { PaymentStatus } = require("../../constants/payments");
const { DEFAULT_DASHBOARD_DATA_INTERVAL_DAYS } = require("../../constants/variables.js");

class ReservationModel {
  static async insert(reservationData) {
    const statement = { ...insertData(Tables.RESERVATIONS, reservationData), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.RESERVATIONS} table`
    };
  }

  static async listByUser(body) {
    const { user_id, sort_by, order, offset, limit, is_paginated } = body;

    const columns = `${Tables.RESERVATIONS}.uid, ${Tables.RESERVATIONS}.name, ${Tables.RESERVATIONS}.email, 
    ${Tables.RESERVATIONS}.phone, ${Tables.RESERVATIONS}.total_pax, ${Tables.RESERVATIONS}.discount, 
    ${Tables.RESERVATIONS}.booked_date, ${Tables.RESERVATIONS}.is_cancelled, ${Tables.RESERVATIONS}.cancel_reason, 
    ${Tables.RESERVATIONS}.cancel_other, ${Tables.RESERVATIONS}.status, ${Tables.RESTAURANTS}.name as res_name`

    let condition = `where ${Tables.RESERVATIONS}.user_id = ? AND ${Tables.RESERVATIONS}.status = 1`;
    const sort = `${Tables.RESERVATIONS}.${sort_by} ${order}`;

    let pagination = `order by ${sort} limit ${offset}, ${limit}`;

    const values = [user_id];
    const countValues = [user_id];


    if (!is_paginated || is_paginated == "" || is_paginated.toString() == 'false') {
      pagination = ``;
    }

    const text = `SELECT ${columns} from ${Tables.RESERVATIONS} INNER JOIN ${Tables.RESTAURANTS} ON ${Tables.RESERVATIONS}.res_id = ${Tables.RESTAURANTS}.id ${condition} ${pagination};`
    const countText = `SELECT Count(${Tables.RESERVATIONS}.id) as count from ${Tables.RESERVATIONS} INNER JOIN ${Tables.RESTAURANTS} ON ${Tables.RESERVATIONS}.res_id = ${Tables.RESTAURANTS}.id ${condition};`;

    const statement = {
      text,
      values,
      rowsOnly: true,
    }

    const countStatement = {
      text: countText,
      values: countValues,
      rowsOnly: true,
    }

    const listPr = db.query(statement);
    const countPr = db.query(countStatement);

    const promiseData = await Promise.all([listPr, countPr]);

    return {
      count: promiseData[1]?.rows[0]?.count,
      rows: promiseData[0]?.rows,
    }
  };

  static async findReservationById(reservationID, transaction = null) {
    const statement = {
      text: `SELECT 
        r.id, 
        r.uid,
        r.user_id, 
        r.slot_id, 
        r.total_guest, 
        r.status, 
        s.seats_left,
        u.fcm_token,
        r.booking_start,
        r.coupon_redeem_id,
        r.created_at,
        rev.name as restaurant_name
      FROM ${Tables.RESERVATIONS} r 
      INNER JOIN ${Tables.RESTAURANTS} rev ON r.res_id = rev.id
      INNER JOIN ${Tables.SLOTS} s ON r.slot_id = s.id 
      INNER JOIN ${Tables.USERS} u ON r.user_id = u.id 
      WHERE r.uid = ?;`,
      values: [reservationID],
      transaction
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async updateOneByID(columns, id, transaction = null) {
    const statement = { ...updateSingle(Tables.RESERVATIONS, columns, id), operation: Operations.UPDATE, transaction };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.RESERVATIONS} table`
    };
  }


  static async listByRestaurant(body) {
    const {
      res_id,
      sort_by,
      order,
      offset,
      limit,
      booking_type = BookingType.UPCOMING,
      is_paginated,
      keyword,
      reservation_id,
      from_date,
      to_date
    } = body;

    const usrAdvPymtIncompleteBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled]
    const pastBookingArr = [
      BookingTrackStatus.cancelled,
      BookingTrackStatus.rejected,
      BookingTrackStatus.payment_completed,
      BookingTrackStatus.completed,
      BookingTrackStatus.noshow,
      BookingTrackStatus.booking_not_accepted,
      BookingTrackStatus.rejected_by_admin
    ]

    const noShowBookingArr = [BookingTrackStatus.noshow]
    const completedBookingArr = [BookingTrackStatus.payment_completed, BookingTrackStatus.completed]
    const cancelledBookingArr = [BookingTrackStatus.cancelled, BookingTrackStatus.rejected, BookingTrackStatus.rejected_by_admin]

    const columns = `rev.uid, rev.name, rev.email, rev.actual_guest_arrived, rev.commission, rev.commission_base_price, rev.commission, rev.commission_currency, 
    rev.phone, rev.total_guest, rev.discount, CAST(rev.is_cancelled AS SIGNED) as is_cancelled, rev.cancel_reason, 
    rev.cancel_type, rev.status, rs.name as res_name, UNIX_TIMESTAMP(TIMESTAMP(sl.date, sl.start_time)) as scheduled_at, UNIX_TIMESTAMP(rev.created_at) as booking_date, DATE_FORMAT(rev.created_at,'%Y-%m-%d %H:%i:%s') as created_at`



    let condition = ``; // Initialize an empty condition.

    if (res_id && res_id !== "") {
      condition = `where rev.res_id = ?`; // Add res_id condition if provided and not an empty string.
    }

    const sort = `rev.${sort_by} ${order}`;

    let pagination = `order by ${sort} limit ${offset}, ${limit}`;

    const values = [res_id];
    const countValues = [res_id];

    if (booking_type == BookingType.UPCOMING) {
      condition += ` and sl.date >= CURDATE() and rev.status not in (${pastBookingArr})`
    } else if (booking_type == BookingType.HISTORICAL) {
      condition += ` and sl.date <= CURDATE() or rev.status in (${pastBookingArr})`
    } else if (booking_type == BookingType.NOSHOW) {
      condition += ` and sl.date <= CURDATE() and rev.status in (${noShowBookingArr})`
    } else if (booking_type == BookingType.COMPLETED || booking_type == BookingType.PAYMENT_COMPLETED) {
      condition += ` and sl.date <= CURDATE() and rev.status in (${completedBookingArr})`
    } else if (booking_type == BookingType.CANCELLED) {
      condition += ` and sl.date <= CURDATE() and rev.status in (${cancelledBookingArr})`
    }

    if (reservation_id && reservation_id !== '') {
      condition += ` and rev.uid = ?`
      values.push(reservation_id);
      countValues.push(reservation_id);
    }

    if (from_date && from_date !== '') {
      condition += ` and DATE_FORMAT(rev.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }

    if (to_date && to_date !== '') {
      condition += ` and DATE_FORMAT(rev.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }

    if (keyword && keyword !== "") {
      condition += ` AND (rev.name LIKE ? OR rev.email LIKE ? OR rev.phone LIKE ?)`
      // condition += ` AND (rs.name LIKE ? OR rs.email LIKE ? OR rev.name LIKE ? OR rev.email LIKE ? OR rev.phone LIKE ?)`
      values.push(`%${keyword}%`);
      values.push(`%${keyword}%`);
      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }

    if (!is_paginated || is_paginated == "" || is_paginated.toString() == 'false') {
      pagination = ``;
    }

    const text = `SELECT ${columns} from ${Tables.RESERVATIONS} rev
     INNER JOIN ${Tables.RESTAURANTS} rs ON rev.res_id = rs.id 
     INNER JOIN ${Tables.SLOTS} sl ON sl.id = rev.slot_id 
     ${condition} ${pagination};`
    const countText = `SELECT Count(rev.id) as count from ${Tables.RESERVATIONS} rev
     INNER JOIN ${Tables.RESTAURANTS} rs ON rev.res_id = rs.id 
     INNER JOIN ${Tables.SLOTS} sl ON sl.id = rev.slot_id 
     ${condition};`;

    const statement = {
      text,
      values,
      rowsOnly: true,
    }

    const countStatement = {
      text: countText,
      values: countValues,
      rowsOnly: true,
    }

    const listPr = db.query(statement);
    const countPr = db.query(countStatement);

    const promiseData = await Promise.all([listPr, countPr]);

    return {
      count: promiseData[1]?.rows[0]?.count,
      rows: promiseData[0]?.rows,
    }
  };

  static async getBookingReminder(datetime, timeDiff, date, status) {
    const statement = {
      text: `select r.id, r.uid, r.user_id, r.booking_start, u.fcm_token from ${Tables.RESERVATIONS} r join ${Tables.USERS} u on r.user_id = u.id where TIMESTAMPDIFF(MINUTE,?,r.booking_start) = ? and r.booking_start like ? and (u.fcm_token is not null or u.fcm_token <> '') and r.status in (${inMapper(status)});`,
      values: [datetime, timeDiff, `${date}%`],
      rowsOnly: true,
    }
    const result = await db.query(statement);
    return result;
  }


  static async getPendingBookingCount(res_id, pendingStatus) {
    const statement = {
      text: `SELECT COUNT(*) as count from ${Tables.RESERVATIONS} where res_id = ? and status = ? ;`,
      values: [res_id, pendingStatus],
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async getTotalCommission(res_id, status) {
    const statement = {
      text: `SELECT SUM(COALESCE(commission, 0)) as total_commission from ${Tables.RESERVATIONS} where res_id = ? and status = ?;`,
      values: [res_id, status],
      rowsOnly: true,
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async list(body) {
    let {
      sort,
      limit,
      offset,
      keyword,
      is_paginated,
      from_date,
      to_date,
      booking_type = BookingType.UPCOMING,
      reservation_id,
      res_id,
      location_id,
      is_nukhba_user,
      res_name,
      type = RESERVATION_TYPE.RESERVATION,
      is_pilot,
      booking_id,
      campaign_code,
      coupon_code,
      coupon_discount,
      reservation_discount,
      user_email_mobile,
      coupon_applied,
    } = body;

    if (type == RESERVATION_TYPE.DASHBOARD) {
      is_pilot = Bit.zero
    }

    const columns = `
      rev.id,
      rev.uid, 
      rev.name, 
      rev.email, 
      rev.actual_guest_arrived,
      CAST(rev.is_nukhba_user AS SIGNED) AS is_nukhba_user,
      rev.commission, 
      rev.commission_base_price, 
      IF(COALESCE(pm.amount, 0) = 0, CASE WHEN cpn_rdm.id IS NOT NULL THEN rev.commission_to_pay ELSE 0 END, COALESCE(pm.actual_amount, rev.total_guest * rev.commission_advance)) AS user_advance_payment,
      rev.commission_currency, 
      rev.phone, 
      rev.total_guest, 
      rev.discount, 
      CAST(rev.is_cancelled AS SIGNED) as is_cancelled, 
      rev.cancel_reason, 
      rev.cancel_type, 
      rev.status, 
      rs.name as res_name, 
      u.uid AS user_id,
      CONCAT(COALESCE(u.first_name,"")," ",COALESCE(u.last_name,"")) AS username,
      u.status AS user_status,
      TIMESTAMP(sl.date, sl.start_time) as scheduled_at, 
      rev.created_at as booking_date, 
      DATE_FORMAT(rev.created_at,'%Y-%m-%d %H:%i:%s') as created_at,
      CASE
        WHEN pm.status = ${PaymentStatus.active.value} THEN '${PaymentStatus.active.key}'
        WHEN pm.status = ${PaymentStatus.completed.value} THEN '${PaymentStatus.completed.key}'
        WHEN pm.status = ${PaymentStatus.refunded.value} THEN '${PaymentStatus.refunded.key}'
        WHEN pm.status = ${PaymentStatus.failed.value} THEN '${PaymentStatus.failed.key}'
        ELSE ''
    END AS payment_status,
    rf.ref_txn_id as refund_ref_id, cpn_rdm.amount AS coupon_amount, cpn.discount AS coupon_discount, cpn.coupon_code, camp.title as campaign_code `

    //booking filter

    const usrAdvPymtIncompleteBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled]
    const pastBookingArr = [
      BookingTrackStatus.cancelled,
      BookingTrackStatus.rejected,
      BookingTrackStatus.payment_completed,
      BookingTrackStatus.completed,
      BookingTrackStatus.noshow,
      BookingTrackStatus.booking_not_accepted,
      BookingTrackStatus.rejected_by_admin
    ]
    const noShowBookingArr = [BookingTrackStatus.noshow]
    const completedBookingArr = [BookingTrackStatus.payment_completed, BookingTrackStatus.completed]
    const cancelledBookingArr = [BookingTrackStatus.cancelled, BookingTrackStatus.rejected]
    const adminRejectedBookingArr = [BookingTrackStatus.rejected_by_admin]

    let condition = `WHERE rev.status NOT IN (${usrAdvPymtIncompleteBookArr})`;
    const values = [];
    const countValues = [];

    if (booking_type == BookingType.UPCOMING) {
      condition += ` and (sl.date >= CURDATE() and rev.status not in (${pastBookingArr}))`
    } else if (booking_type == BookingType.HISTORICAL) {
      condition += ` and (sl.date <= CURDATE() or rev.status in (${pastBookingArr}))`
    } else if (booking_type == BookingType.NOSHOW) {
      condition += ` and (sl.date <= CURDATE() and rev.status in (${noShowBookingArr}))`
    } else if (booking_type == BookingType.COMPLETED || booking_type == BookingType.PAYMENT_COMPLETED) {
      condition += ` and (sl.date <= CURDATE() and rev.status in (${completedBookingArr}))`
    } else if (booking_type == BookingType.CANCELLED) {
      condition += ` and (sl.date <= CURDATE() and rev.status in (${cancelledBookingArr}))`
    } else if (booking_type == BookingType.REFUNDED) {
      condition += ` and (sl.date <= CURDATE() and rev.status in (${adminRejectedBookingArr}) and pm.status = ${PaymentStatus.refunded.value})`
    }

    let pagination = `ORDER BY rev.${sort} LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY rev.${sort}`;
    }

    if (!isEmptyField(keyword)) {
      condition += ` AND (rev.name LIKE ? OR rev.email LIKE ? OR rs.name LIKE ? OR rev.phone LIKE ? )`
      // condition += ` AND (rs.name LIKE ? OR rs.email LIKE ? OR rev.name LIKE ? OR rev.email LIKE ? OR rev.phone LIKE ?)`
      values.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`,`%${keyword}%`);
      countValues.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`,`%${keyword}%`);
    }

    if (!isEmptyField(from_date)) {
      condition += ` AND DATE_FORMAT(rev.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }
    if (!isEmptyField(to_date)) {
      condition += ` AND DATE_FORMAT(rev.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }
    if (!isEmptyField(res_id)) {
      condition += ` AND rs.uid = ?`
      values.push(res_id);
      countValues.push(res_id);
    }
    if (!isEmptyField(reservation_id)) {
      condition += ` and rev.uid = ?`
      values.push(reservation_id);
      countValues.push(reservation_id);
    }
    if (!isEmptyField(location_id)) {
      condition += ` and l.uid = ?`
      values.push(location_id);
      countValues.push(location_id);
    }
    if (!isEmptyField(is_nukhba_user)) {
      condition += ` and rev.is_nukhba_user = ?`
      values.push(is_nukhba_user);
      countValues.push(is_nukhba_user);
    }

    if (type == RESERVATION_TYPE.RESERVATION) {
      if (!isEmptyField(is_pilot)) {
        condition += ` and rev.is_pilot = ?`
        values.push(is_pilot);
        countValues.push(is_pilot);
      }
    } else {
      if (!isEmptyField(is_pilot)) {
        condition += ` and rev.is_pilot = ?`
        values.push(is_pilot);
        countValues.push(is_pilot);
      }
    }

    if (!isEmptyField(res_name)) {
      condition += ` AND (rs.name LIKE ?)`
      values.push(`%${res_name}%`);
      countValues.push(`%${res_name}%`);
    }

    if (!isEmptyField(booking_id)) {
      condition += ` and rev.uid = ?`
      values.push(booking_id);
      countValues.push(booking_id);
    }

    if (!isEmptyField(campaign_code)) {
      condition += ` and camp.title = ?`
      values.push(campaign_code);
      countValues.push(campaign_code);
    }

    if (!isEmptyField(coupon_discount)) {
      condition += ` and cpn.discount = ?`
      values.push(coupon_discount);
      countValues.push(coupon_discount);
    }

    if (!isEmptyField(reservation_discount)) {
      condition += ` and rev.discount = ?`
      values.push(reservation_discount);
      countValues.push(reservation_discount);
    }

    if (!isEmptyField(coupon_code)) {
      condition += ` and cpn.coupon_code = ?`
      values.push(coupon_code);
      countValues.push(coupon_code);
    }

    if (!isEmptyField(coupon_applied)) {
      if (coupon_applied == Bit.one) {
        condition += ` and rev.coupon_redeem_id IS NOT NULL`
      } else {
        condition += ` and rev.coupon_redeem_id IS NULL`
      }
    }

    if (!isEmptyField(user_email_mobile)) {
      condition += ` and ( u.email LIKE ? OR u.mobile LIKE ? )`
      values.push(`%${user_email_mobile}%`, `%${user_email_mobile}%`,);
      countValues.push(`%${user_email_mobile}%`, `%${user_email_mobile}%`,);
    }

    const text = `SELECT ${columns} from ${Tables.RESERVATIONS} rev
     INNER JOIN ${Tables.RESTAURANTS} rs ON rev.res_id = rs.id 
     INNER JOIN ${Tables.SLOTS} sl ON sl.id = rev.slot_id
     LEFT JOIN ${Tables.PAYMENTS} pm ON pm.reservation_id = rev.id
     LEFT JOIN ${Tables.REFUNDS} rf ON rf.transaction_id = pm.id
     LEFT JOIN ${Tables.LOCATION} l ON rs.location_id = l.id
     LEFT JOIN ${Tables.USERS} u ON rev.user_id = u.id
     LEFT JOIN ${Tables.CAMPAIGN} camp ON camp.id = u.campaign_id
     LEFT JOIN ${Tables.COUPON_REDEEM} cpn_rdm ON cpn_rdm.id = rev.coupon_redeem_id
     LEFT JOIN ${Tables.COUPONS} cpn ON cpn_rdm.coupon_id = cpn.id
     ${condition} ${pagination};`
    const countText = `SELECT Count(rev.id) as count from ${Tables.RESERVATIONS} rev
     INNER JOIN ${Tables.RESTAURANTS} rs ON rev.res_id = rs.id 
     INNER JOIN ${Tables.SLOTS} sl ON sl.id = rev.slot_id
     LEFT JOIN ${Tables.PAYMENTS} pm ON pm.reservation_id = rev.id
     LEFT JOIN ${Tables.LOCATION} l ON rs.location_id = l.id
     LEFT JOIN ${Tables.USERS} u ON rev.user_id = u.id
     LEFT JOIN ${Tables.CAMPAIGN} camp ON camp.id = u.campaign_id
     LEFT JOIN ${Tables.COUPON_REDEEM} cpn_rdm ON cpn_rdm.id = rev.coupon_redeem_id
     LEFT JOIN ${Tables.COUPONS} cpn ON cpn_rdm.coupon_id = cpn.id
     ${condition};`;

    const statement = {
      text,
      values,
      rowsOnly: true,
    }

    const countStatement = {
      text: countText,
      values: countValues,
      rowsOnly: true,
    }

    const listPr = db.query(statement);
    const countPr = db.query(countStatement);

    const promiseData = await Promise.all([listPr, countPr]);

    return {
      count: promiseData[1]?.rows[0]?.count || 0,
      rows: promiseData[0]?.rows || [],
    }
  };

  static async getTotalStatusCount(date, is_nukhba_user, is_pilot) {

    const usrAdvPymtIncompleteBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled]
    const values = []
    let condition = `WHERE rev.status NOT IN (${usrAdvPymtIncompleteBookArr}) AND rev.is_nukhba_user = '${is_nukhba_user}' AND rev.is_pilot = '${is_pilot}'`;
    if (date) {
      condition += ` AND rev.created_at like ? `
      values.push(`${date}%`)
    }


    const statement = {
      text: `SELECT COUNT(rev.status) AS count, rev.status as status,
      CASE
          WHEN rev.status  = 1 THEN "Upcoming"
          WHEN rev.status  = 2 THEN "Approved"
          WHEN rev.status  = 3 THEN "Arrived"
          WHEN rev.status  = 4 THEN "Completed"
          WHEN rev.status  = 0 THEN "Deleted"
          WHEN rev.status  = -1 THEN "Cancelled by Merchant"
          WHEN rev.status  = -2 THEN "Cancelled by User"
          WHEN rev.status  = -3 THEN "No Show"
          WHEN rev.status  = -4 THEN "Pending"
          WHEN rev.status  = -5 THEN "Booking Not Accepted"
          WHEN rev.status  = -6 THEN "Auto Cancelled"
          WHEN rev.status  = -7 THEN "Payment Pending"
          WHEN rev.status  = -8 THEN "Cancelled by Admin"
      END AS status_text
      from ${Tables.RESERVATIONS} rev
      INNER JOIN ${Tables.RESTAURANTS} rs ON rev.res_id = rs.id
      INNER JOIN ${Tables.SLOTS} sl ON sl.id = rev.slot_id
      INNER JOIN ${Tables.USERS} u ON rev.user_id = u.id
      ${condition} group by rev.status;`,
      values,
    }

    const result = await db.query(statement);
    return result.rows;
  }

  static async getBookingPercentageOfTotalVisits(date, forUniqueUser = false, is_nukhba_user, is_pilot) {
    const values = []
    const usrAdvPymtIncompleteBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled]
    let condition = `WHERE rev.status NOT IN (${usrAdvPymtIncompleteBookArr}) AND rev.is_nukhba_user = '${is_nukhba_user}' AND rev.is_pilot = '${is_pilot}'`;
    let condition2 = '';
    if (date) {
      condition += ` AND rev.created_at like ? `
      condition2 = 'WHERE DATE(last_seen) = ?'
      values.push(`${date}%`)
      values.push(date)
    }

    let alias = 'booking_rate'

    let uniqueUser = '*';
    if (forUniqueUser) {
      uniqueUser = 'distinct rev.user_id'
      alias = 'unique_booking_rate'
    }

    const statement = {
      text: `SELECT 
      COALESCE((
        (SELECT COUNT(${uniqueUser}) 
        FROM ${Tables.RESERVATIONS} rev 
        INNER JOIN ${Tables.RESTAURANTS} rs ON rev.res_id = rs.id
        INNER JOIN ${Tables.SLOTS} sl ON sl.id = rev.slot_id 
        INNER JOIN ${Tables.USERS} u ON rev.user_id = u.id
        ${condition})
        /
      (SELECT COUNT(*) FROM ${Tables.USERS} ${condition2}) * 100), 0) AS ${alias};`,
      values,
    }

    const result = await db.query(statement);
    return result.rows;
  }

  static async getUniqueResUser(date, forUniqueUser = false, is_nukhba_user, is_pilot) {
    const values = []
    const usrAdvPymtIncompleteBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled]
    let condition = `WHERE rev.status NOT IN (${usrAdvPymtIncompleteBookArr}) AND rev.is_nukhba_user = '${is_nukhba_user}' AND rev.is_pilot = '${is_pilot}' `;
    if (date) {
      condition += ` AND rev.created_at like ? `
      values.push(`${date}%`)
    }

    let uniqueUser = '*';
    if (forUniqueUser) {
      uniqueUser = 'distinct rev.user_id'
    }

    const statement = {
      text: `SELECT 
      COALESCE(
        (SELECT COUNT(${uniqueUser})
        FROM ${Tables.RESERVATIONS} rev 
        INNER JOIN ${Tables.RESTAURANTS} rs ON rev.res_id = rs.id
        INNER JOIN ${Tables.SLOTS} sl ON sl.id = rev.slot_id 
        INNER JOIN ${Tables.USERS} u ON rev.user_id = u.id
        ${condition}), 0) AS unique_reservation_user;`,
      values,
    }

    const result = await db.query(statement);
    return result.rows;
  }

  static async getActiveUserToday(date, forUniqueUser = false, is_nukhba_user, is_pilot) {
    const values = []
    let condition2 = `WHERE is_nukhba_user = '${is_nukhba_user}' AND is_pilot = '${is_pilot}' `;
    if (date) {
      condition2 += ' AND DATE(last_seen) = ?'
      values.push(date)
    }

    let uniqueUser = '*';
    if (forUniqueUser) {
      uniqueUser = 'distinct rev.user_id'
    }

    const statement = {
      text: `SELECT COALESCE((SELECT COUNT(*) FROM ${Tables.USERS} ${condition2}), 0) AS active_user_today;`,
      values,
    }

    const result = await db.query(statement);
    return result.rows;
  }


  static async getBookingPercentageOfTotalVisits(date, forUniqueUser = false) {
    const values = []
    const usrAdvPymtIncompleteBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled]
    let condition = `WHERE rev.status NOT IN (${usrAdvPymtIncompleteBookArr})`;
    let condition2 = '';
    if (date) {
      condition += ` AND rev.created_at like ? `
      condition2 = 'WHERE DATE(last_seen) = ?'
      values.push(`${date}%`)
      values.push(date)
    }

    let alias = 'booking_rate'

    let uniqueUser = '*';
    if (forUniqueUser) {
      uniqueUser = 'distinct rev.user_id'
      alias = 'unique_booking_rate'
    }

    const statement = {
      text: `SELECT 
      COALESCE((
        (SELECT COUNT(${uniqueUser}) 
        FROM ${Tables.RESERVATIONS} rev 
        INNER JOIN ${Tables.RESTAURANTS} rs ON rev.res_id = rs.id
        INNER JOIN ${Tables.SLOTS} sl ON sl.id = rev.slot_id 
        ${condition})
        /
      (SELECT COUNT(*) FROM ${Tables.USERS} ${condition2}) * 100), 0) AS ${alias};`,
      values,
    }

    const result = await db.query(statement);
    return result.rows;
  }

  static async getAverageRevenuePerUser(date) {
    const values = []
    let condition = '';
    if (date) {
      condition = ` WHERE r.created_at like ? `
      values.push(`${date}%`)
    }

    const statement = {
      text: `SELECT 
      SUM(
          COALESCE(
              p.actual_amount,
              CASE
                  WHEN JSON_EXTRACT(r.other_details, '$.telr_live') = 0 THEN 0
                  ELSE r.total_guest * r.commission_advance
              END
          )
      ) / COUNT(r.id) AS total_acpu
  FROM 
      ${Tables.RESERVATIONS} r
  LEFT JOIN 
      ${Tables.PAYMENTS} p ON r.id = p.reservation_id 
   ${condition} ;`,
      values,
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async getCartAbandoned(date, is_nukhba_user, is_pilot) {
    const usrAdvPymtIncompleteBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled]
    const values = []
    let condition = `WHERE rev.status IN (${usrAdvPymtIncompleteBookArr}) AND rev.is_nukhba_user = '${is_nukhba_user}' AND rev.is_pilot = '${is_pilot}' `;
    if (date) {
      condition += ` AND rev.created_at like ? `
      values.push(`${date}%`)
    }

    const statement = {
      text: `SELECT COUNT(rev.id) AS payment_failure_count
      from ${Tables.RESERVATIONS} rev
      INNER JOIN ${Tables.USERS} u ON rev.user_id = u.id
      ${condition} ;`,
      values,
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async getUserPerTransaction(date, is_nukhba_user, is_pilot) {
    const values = []
    let condition = '';
    if (date) {
      condition = ` AND rev.created_at like ? `
      values.push(`${date}%`)
    }

    const statement = {
      text: `SELECT SUM(rev.total_guest)/COUNT(rev.id) as transaction_count 
      FROM ${Tables.RESERVATIONS} rev
      INNER JOIN ${Tables.USERS} u ON rev.user_id = u.id
      WHERE rev.status = '${ReservationTrackStatus.find(elem => elem.key = 'approved').value}' AND rev.is_nukhba_user = '${is_nukhba_user}' AND rev.is_pilot = '${is_pilot}' ${condition};`,
      values,
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async avgRevenuePerUser(data = {}) {
    const { from_date, to_date, is_nukhba_user, is_pilot } = data;

    const usrIncompleteAdvPymtBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled]
    let condition = ` AND rev.status not in (${usrIncompleteAdvPymtBookArr})`;
    const values = []

    if (!isEmptyField(from_date)) {
      condition += ` AND DATE_FORMAT(rev.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
    }
    if (!isEmptyField(to_date)) {
      condition += ` AND DATE_FORMAT(rev.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
    }

    const statement = {
      text: `SELECT SUM(rev.commission_to_pay)/SUM(rev.total_guest) AS avg_revenue_per_user
        FROM ${Tables.RESERVATIONS} rev INNER JOIN ${Tables.USERS} u ON rev.user_id = u.id
        INNER JOIN ${Tables.SLOTS} sl ON sl.id = rev.slot_id 
        WHERE 1 AND rev.is_nukhba_user = '${is_nukhba_user}' AND rev.is_pilot = '${is_pilot}' ${condition};`,
      values,
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async avgTransactionValue(data = {}) {
    const { from_date, to_date, is_nukhba_user, is_pilot } = data;

    const usrIncompleteAdvPymtBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled];
    const approvedBookingArr = [BookingTrackStatus.approved]

    let condition = ` AND rev.status not in (${usrIncompleteAdvPymtBookArr})`;
    // let condition = ` AND rev.status IN (${approvedBookingArr})`;
    const values = []

    if (!isEmptyField(from_date)) {
      condition += ` AND DATE_FORMAT(rev.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
    }
    if (!isEmptyField(to_date)) {
      condition += ` AND DATE_FORMAT(rev.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
    }

    const statement = {
      text: `SELECT SUM(rev.commission_to_pay)/SUM(IF(rev.status=${BookingTrackStatus.approved}, 1, 0)) AS avg_transaction_value 
        FROM ${Tables.RESERVATIONS} rev INNER JOIN ${Tables.USERS} u ON rev.user_id = u.id
        INNER JOIN ${Tables.SLOTS} sl ON sl.id = rev.slot_id 
        WHERE 1 AND rev.is_nukhba_user = '${is_nukhba_user}' AND rev.is_pilot = '${is_pilot}' ${condition};`,
      values,
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async totalBookingFeeReceived(data = {}) {
    const { from_date, to_date, is_nukhba_user, is_pilot } = data;

    const usrIncompleteAdvPymtBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled];
    const approvedBookingArr = [BookingTrackStatus.approved]

    let condition = ` AND rev.status NOT IN (${usrIncompleteAdvPymtBookArr})`;
    const values = []

    if (!isEmptyField(from_date)) {
      condition += ` AND DATE_FORMAT(rev.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
    }
    if (!isEmptyField(to_date)) {
      condition += ` AND DATE_FORMAT(rev.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
    }

    const statement = {
      text: `SELECT SUM(IF(COALESCE(pm.amount, 0) = 0, CASE WHEN cpr.id IS NOT NULL THEN rev.commission_to_pay ELSE 0 END, COALESCE(pm.actual_amount, rev.total_guest * rev.commission_advance))) 
      AS total_booking_fee_received  
      FROM ${Tables.RESERVATIONS} rev INNER JOIN ${Tables.USERS} u ON rev.user_id = u.id
        INNER JOIN ${Tables.SLOTS} sl ON sl.id = rev.slot_id
        LEFT JOIN ${Tables.PAYMENTS} pm ON pm.reservation_id = rev.id
        LEFT JOIN ${Tables.COUPON_REDEEM} cpr ON cpr.id = rev.coupon_redeem_id
        WHERE 1 AND rev.is_nukhba_user = '${is_nukhba_user}' AND rev.is_pilot = '${is_pilot}' ${condition};`,
      values,
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async revenueData(data = {}) {
    const { from_date, to_date, res_id, is_nukhba_user, is_pilot } = data;

    const usrIncompleteAdvPymtBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled]
    let condition = ` AND rev.status not in (${usrIncompleteAdvPymtBookArr})`;
    const values = []

    if (!isEmptyField(from_date)) {
      condition += ` AND DATE_FORMAT(rev.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
    }
    if (!isEmptyField(to_date)) {
      condition += ` AND DATE_FORMAT(rev.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
    }
    if (!isEmptyField(res_id)) {
      condition += ` AND rev.res_id = ?`
      values.push(res_id);
    }

    const statement = {
      text: `SELECT SUM(rev.commission_to_pay) AS total_revenue, AVG(rev.commission_to_pay) AS avg_revenue_per_booking
        FROM ${Tables.RESERVATIONS} rev INNER JOIN ${Tables.USERS} u ON rev.user_id = u.id
        INNER JOIN ${Tables.SLOTS} sl ON sl.id = rev.slot_id 
        WHERE 1 AND rev.is_nukhba_user = '${is_nukhba_user}' AND rev.is_pilot = '${is_pilot}' ${condition};`,
      values,
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async totalReferrals(data = {}) {
    const { from_date, to_date, user_id, is_nukhba_user, is_pilot } = data;

    let condition = ` AND usr.referred_by IS NOT NULL AND usr.status NOT IN (${UserStatus.deleted})`;
    const values = []

    if (!isEmptyField(from_date)) {
      condition += ` AND DATE_FORMAT(usr.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
    }
    if (!isEmptyField(to_date)) {
      condition += ` AND DATE_FORMAT(usr.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
    }
    if (!isEmptyField(user_id)) {
      condition += ` AND reUsr.uid = ?`
      values.push(user_id);
    }

    const statement = {
      // text: `SELECT COUNT(usr.id) AS total_referrals
      //   FROM ${Tables.USERS} usr
      //   INNER JOIN ${Tables.USERS} reUsr ON reUsr.id = usr.referred_by 
      //   ${condition};`,
      text: `SELECT COUNT(usr.id) AS total_referrals
        FROM ${Tables.USERS} usr
        INNER JOIN ${Tables.USERS} reUsr ON reUsr.id = usr.referred_by 
        WHERE 1 AND reUsr.is_nukhba_user = '${is_nukhba_user}' AND reUsr.is_pilot = '${is_pilot}' ${condition};`,
      values,
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async topUsersByReferralCount(data) {
    const { from_date, to_date } = data;

    let condition = ` AND usr.status NOT IN (${UserStatus.deleted})`;
    const values = []

    if (!isEmptyField(from_date)) {
      condition += ` AND DATE_FORMAT(usr.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
    }
    if (!isEmptyField(to_date)) {
      condition += ` AND DATE_FORMAT(usr.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
    }


    const statement = {
      text: `SELECT usr.uid AS id, CONCAT(usr.first_name, ' ', usr.last_name) As name, usr.email
        FROM ${Tables.USERS} usr WHERE 1 ${condition}
        ORDER BY (SELECT COUNT(referredUser.referred_by) FROM ${Tables.USERS} referredUser WHERE referredUser.referred_by = usr.id) DESC
        LIMIT 5;`,
      values,
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async findTotalDiners(currentDate, is_nukhba_user, is_pilot) {
    const usrAdvPymtIncompleteBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled]
    const query = `
    SELECT COALESCE(SUM(rev.total_guest),0) AS total_diners
    FROM ${Tables.RESERVATIONS} rev INNER JOIN ${Tables.USERS} u ON rev.user_id = u.id
    WHERE rev.created_at like  ? AND rev.is_nukhba_user = '${is_nukhba_user}' AND rev.is_pilot = '${is_pilot}' AND rev.status NOT IN (${usrAdvPymtIncompleteBookArr})`
    const statement = {
      text: query,
      values: [`${currentDate}%`],
      rowsOnly: true,
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async findTotalUniqueDiners(currentDate, is_nukhba_user, is_pilot) {
    const usrAdvPymtIncompleteBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled]
    const query = `SELECT count(DISTINCT rev.user_id) as total_unique_diners from ${Tables.RESERVATIONS} rev INNER JOIN ${Tables.USERS} u ON rev.user_id = u.id where DATE_FORMAT(rev.created_at,'%Y-%m-%d %H:%i:%s') = ? AND rev.status NOT IN (${usrAdvPymtIncompleteBookArr}) AND
    rev.is_nukhba_user = '${is_nukhba_user}' AND rev.is_pilot = '${is_pilot}' `
    const statement = {
      text: query,
      values: [currentDate],
      rowsOnly: true,
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async findActualDiners(currentDate, is_nukhba_user, is_pilot) {
    const query = `
    SELECT  COALESCE(SUM(rev.actual_guest_arrived),0) AS actual_diners
    FROM ${Tables.RESERVATIONS} rev INNER JOIN ${Tables.USERS} u ON rev.user_id = u.id
    WHERE rev.created_at like  ? AND rev.status = ? AND rev.is_nukhba_user = '${is_nukhba_user}' AND rev.is_pilot = '${is_pilot}' `
    const statement = {
      text: query,
      values: [`${currentDate}%`, BookingTrackStatus.payment_completed],
      rowsOnly: true,
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async findFailedTransactions(currentDate, is_nukhba_user, is_pilot) {
    const query = `SELECT count(rev.id) as failed_transactions from ${Tables.RESERVATIONS} rev INNER JOIN ${Tables.USERS} u ON rev.user_id = u.id
    WHERE rev.created_at like  ? AND  (rev.status = ? OR rev.status = ? ) AND rev.is_nukhba_user = '${is_nukhba_user}' AND rev.is_pilot = '${is_pilot}'`
    const statement = {
      text: query,
      values: [`${currentDate}%`, BookingTrackStatus.pending, BookingTrackStatus.auto_cancelled],
      rowsOnly: true,
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async findDailyReservations(currentDate) {
    const usrAdvPymtIncompleteBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled]
    const values = []
    let condition = `WHERE rev.status NOT IN (${usrAdvPymtIncompleteBookArr})`;
    if (currentDate) {
      condition = ` WHERE rev.created_at like ? `
      values.push(`${currentDate}%`)
    }


    const statement = {
      text: `SELECT COUNT(rev.status) AS count, rev.status as status,
      CASE
          WHEN rev.status  = 1 THEN "Upcoming"
          WHEN rev.status  = 2 THEN "Approved"
          WHEN rev.status  = 3 THEN "Arrived"
          WHEN rev.status  = 4 THEN "Completed"
          WHEN rev.status  = 0 THEN "Deleted"
          WHEN rev.status  = -1 THEN "Cancelled by Merchant"
          WHEN rev.status  = -2 THEN "Cancelled by User"
          WHEN rev.status  = -3 THEN "No Show"
          WHEN rev.status  = -4 THEN "Pending"
          WHEN rev.status  = -5 THEN "Booking Not Accepted"
          WHEN rev.status  = -6 THEN "Auto Cancelled"
          WHEN rev.status  = -7 THEN "Payment Pending"
          WHEN rev.status  = -8 THEN "Cancelled by Admin"
      END AS status_text
      from ${Tables.RESERVATIONS} rev
      INNER JOIN ${Tables.RESTAURANTS} rs ON rev.res_id = rs.id
      INNER JOIN ${Tables.SLOTS} sl ON sl.id = rev.slot_id
      ${condition} group by rev.status;`,
      values,
    }

    const result = await db.query(statement);
    return result.rows;
  }

  static async mostBookedRestro(validData = {}) {
    const { from_date, to_date, is_nukhba_user = Bit.zero, is_pilot = Bit.zero } = validData

    let condition = ` WHERE rv.is_nukhba_user = '${is_nukhba_user}' AND rv.is_pilot = ${is_pilot}  `;
    let values = []

    if (!isEmptyField(from_date) && !isEmptyField(to_date)) {
      condition += ` AND DATE_FORMAT(rv.created_at,'%Y-%m-%d %H:%i:%s') >= ? AND DATE_FORMAT(rv.created_at,'%Y-%m-%d %H:%i:%s') <=  ? `;
      values.push(from_date, to_date)
    } else if (!isEmptyField(from_date)) {
      condition += ` AND DATE_FORMAT(rv.created_at,'%Y-%m-%d %H:%i:%s') >= ?`;
      values.push(from_date)
    } else if (!isEmptyField(to_date)) {
      condition += ` AND DATE_FORMAT(rv.created_at,'%Y-%m-%d %H:%i:%s') <= ?`;
      values.push(to_date)
    } else {
      condition += ` AND DATE_FORMAT(rv.created_at,'%Y-%m-%d %H:%i:%s') >= CURDATE() - INTERVAL ${DEFAULT_DASHBOARD_DATA_INTERVAL_DAYS} DAY`;
    }

    const usrAdvPymtIncompleteBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled]
    condition += ` AND rv.status NOT IN (${usrAdvPymtIncompleteBookArr})`;

    condition += `
     GROUP BY r.uid, r.name
     ORDER BY reservation_count DESC;
    `

    const query = `SELECT r.name AS restaurant_name,r.uid as res_uid, COUNT(*) AS reservation_count
    FROM ${Tables.RESERVATIONS} rv
    INNER JOIN ${Tables.RESTAURANTS} r ON rv.res_id = r.id ${condition} `
    const statement = {
      text: query,
      values: values,
      rowsOnly: true,
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async listInstantPayment(body) {
    const {
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
    } = body;

    let condition = `WHERE r.is_instant_payment = ${Bit.one}`;

    const columns = `r.uid as reservation_id, r.email, r.created_at,
     r.user_id, rest.uid as restaurant_id, rest.name as restaurant_name,
      COALESCE(r.name, u.first_name) as username, p.amount,
       p.status as payment_status , p.order_status_code, 
       p.other_details as payment_other_details,
        p.ref_txn_id as ref_txn_id, u.uid as user_id, u.status as user_status  `

    const sort = `r.${sort_by} ${order}`;
    let pagination = `order by ${sort} limit ${offset}, ${limit}`;

    const values = [];
    const countValues = [];

    if (!is_paginated || is_paginated === "" || is_paginated.toString() === 'false') {
      pagination = ``;
    }

    if (from_date && from_date !== '') {
      condition += ` and DATE_FORMAT(r.created_at,'%Y-%m-%d') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }

    if (to_date && to_date !== '') {
      condition += ` and DATE_FORMAT(r.created_at,'%Y-%m-%d') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }

    if (!isEmptyField(order_status_code)) {
      condition += ` AND p.order_status_code = ? `
      values.push(`${order_status_code}`);
      countValues.push(`${order_status_code}`);
}

    if (reservation_id && reservation_id !== '') {
      condition += ` AND r.uid = ?`
      values.push(reservation_id);
      countValues.push(reservation_id);
    }

    if (restaurant_id && restaurant_id !== '') {
      condition += ` AND rest.uid = ?`
      values.push(restaurant_id);
      countValues.push(restaurant_id);
    }

    if (restaurant_name && restaurant_name !== '') {
      condition += ` AND LOWER(rest.name) LIKE LOWER(?)`
      values.push(`%${restaurant_name}%`);
      countValues.push(`%${restaurant_name}%`);
    }

    const text = `SELECT ${columns} FROM ${Tables.RESERVATIONS} r 
      JOIN ${Tables.USERS} u ON r.user_id = u.id JOIN ${Tables.PAYMENTS} p on r.id = p.reservation_id 
      JOIN ${Tables.RESTAURANTS} rest on r.res_id = rest.id
      ${condition} ${pagination};`
    const countText = `SELECT Count(r.id) as count FROM ${Tables.RESERVATIONS} r 
      JOIN ${Tables.USERS} u ON r.user_id = u.id JOIN ${Tables.PAYMENTS} p on r.id = p.reservation_id 
      JOIN ${Tables.RESTAURANTS} rest on r.res_id = rest.id
      ${condition}`;

    const statement = {
      text: text,
      values,
      rowsOnly: true,
    }

    const countStatement = {
      text: countText,
      values: countValues,
      rowsOnly: true,
    }

    const listPr = db.query(statement);
    const countPr = db.query(countStatement);

    const promiseData = await Promise.all([listPr, countPr]);

    return {
      count: promiseData[1]?.rows[0]?.count,
      rows: promiseData[0]?.rows,
    }
  };

}

module.exports = ReservationModel;
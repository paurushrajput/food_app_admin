const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");

const { Tables, Operations, CouponStatus, CouponDiscountType, BookingTrackStatus, Bit, CancelledBookingStatus, UserStatus, ReservationTrackStatus } = require("../../constants/database");

const { isEmptyField } = require("../../utils/common");

class CouponsModel {

  static async insert(coupons) {
    const statement = { ...insertData(Tables.COUPONS, coupons), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.COUPONS} table`
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.COUPONS, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.COUPONS} table`
    };
  }

  static async expireCoupons(millis = Math.floor(Date.now() / 1000)) {
    const statement = {
      text: `UPDATE ${Tables.COUPONS} set status = ${CouponStatus.expired} where status <> ${CouponStatus.expired} and expiration_at >= ? and deleted_at is null ;`,
      values: [millis],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findOneByuId(uid, transaction) {
    const statement = {
      text: `SELECT id, uid, coupon_code, organization_id, uses_per_user, discount, discount_type, max_discount, min_use, max_use, description, expiration_at, type, status, rules FROM ${Tables.COUPONS} where uid = ? and deleted_at is null ;`,
      values: [uid],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findOneById(id, transaction) {
    const statement = {
      text: `SELECT id, uid, coupon_code, organization_id, uses_per_user, discount, discount_type, max_discount, min_use, max_use, description, expiration_at, type, status FROM ${Tables.COUPONS} where id = ? and deleted_at is null ;`,
      values: [id],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async listAndFilterCoupons(body) {
    const reservationStatusFilter = ReservationTrackStatus?.filter(elem => elem.key == 'auto_cancelled' || 
      elem.key == 'rejected_by_admin' || elem.key == 'rejected')?.map(elem => elem.value);
    const { sort, offset, limit, is_paginated, organization_id = "", uses_per_user = "", discount = "", discount_type = "", type = "", status = "",is_deleted, campaign_title, is_expired } = body;
    // const columns = `DISTINCT c.uid as id, o.uid AS organization_id, c.deleted_at, c.coupon_code, c.uses_per_user, c.discount, c.discount_type, c.max_discount, c.min_use, c.max_use, c.description, c.expiration_at, c.type, c.status, c.rules, (SELECT COUNT(*) FROM coupon_redeem cr WHERE cr.coupon_id = c.id) AS total_use, CASE WHEN c.deleted_at IS NULL THEN 1 ELSE 0 END AS is_deleted, CASE WHEN c.expiration_at >= UNIX_TIMESTAMP() THEN 'live' ELSE 'completed' END AS coup_status ,(SELECT COUNT(cpn.id) AS count FROM coupons cpn INNER JOIN coupon_redeem cr ON cr.coupon_id = cpn.id INNER JOIN users u ON cr.user_id = u.id WHERE cpn.id = c.id AND u.status != 0) AS assigned_cpn_count,(SELECT COUNT(cpn.id) AS count FROM coupons cpn INNER JOIN coupon_redeem cr ON cr.coupon_id = cpn.id INNER JOIN users u ON cr.user_id = u.id LEFT JOIN reservations rev ON rev.coupon_redeem_id = cr.id AND rev.status NOT IN (${inMapper(reservationStatusFilter)}) WHERE cpn.id = c.id AND u.status != 0 AND CASE WHEN cr.is_used = 1 THEN rev.id IS NULL ELSE cr.is_used = 0 END) AS unused_cpn_count FROM coupons c LEFT JOIN organizations o ON o.id = c.organization_id LEFT JOIN campaign camp ON c.id = camp.coupon_id `
    const columns = `DISTINCT c.uid as id, o.uid AS organization_id, c.deleted_at, c.coupon_code, c.uses_per_user, c.discount, c.discount_type, c.max_discount, c.min_use, c.max_use, c.description, c.expiration_at, c.type, c.status, c.rules, (SELECT COUNT(*) FROM coupon_redeem cr WHERE cr.coupon_id = c.id) AS total_use,  CASE WHEN c.deleted_at IS NULL THEN 1 ELSE 0 END AS is_deleted, CASE
        WHEN c.expiration_at >= UNIX_TIMESTAMP() THEN 'live'
        ELSE 'completed' END AS coup_status `
    // let condition = ` c.deleted_at is NULL `;
    let condition = `1 `;

    const values = [];
    const countValues = [];

    let pagination = `ORDER BY ${sort} LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY ${sort}`;
    }

    if (typeof organization_id != 'undefined' && organization_id !== "") {
      condition += ` AND c.organization_id =  ? `
      values.push(organization_id);
      countValues.push(organization_id);
    }

    if (typeof uses_per_user != 'undefined' && uses_per_user !== "") {
      condition += ` AND c.uses_per_user =  ? `
      values.push(uses_per_user);
      countValues.push(uses_per_user);
    }

    if (typeof discount != 'undefined' && discount !== "") {
      condition += ` AND c.discount LIKE  ? `
      values.push(`%${discount}%`);
      countValues.push(`%${discount}%`);
    }

    if (discount_type && discount_type !== "") {
      condition += ` AND c.discount_type =  ? `
      values.push(discount_type);
      countValues.push(discount_type);
    }

    if (typeof type != 'undefined' && type !== "") {
      condition += ` AND c.type =  ? `
      values.push(type);
      countValues.push(type);
    }

    if (typeof status != 'undefined' && status !== "") {
      condition += ` AND c.status =  ? `
      values.push(status);
      countValues.push(status);
    }

    if(!isEmptyField(campaign_title)){
      let campaign_title_trimmed = campaign_title.trim()
      condition += ` AND camp.title = ?`
      values.push(campaign_title_trimmed);
      countValues.push(campaign_title_trimmed);
    }
    if(is_deleted == Bit.one){
      condition += ` AND c.deleted_at IS NOT NULL`
    }else if(is_deleted == Bit.zero){
      condition += ` AND c.deleted_at IS NULL`
    }
    if (!isEmptyField(is_expired)) {
      if (is_expired == Bit.zero) {
        condition += ` AND c.expiration_at >= UNIX_TIMESTAMP()`
      } else {
        condition += ` AND c.expiration_at < UNIX_TIMESTAMP() `
      }

    }

    const assignedCouponCountQuery = `(SELECT COUNT(cpn.id) AS count 
      FROM ${Tables.COUPONS} cpn 
      INNER JOIN ${Tables.COUPON_REDEEM} cr ON cr.coupon_id = cpn.id
      INNER JOIN ${Tables.USERS} u ON cr.user_id = u.id
      WHERE cpn.id = c.id AND u.status != ${UserStatus.deleted}) AS assigned_cpn_count`

    const unUsedCouponCountQuery = `(SELECT COUNT(cpn.id) AS count 
      FROM ${Tables.COUPONS} cpn 
      INNER JOIN ${Tables.COUPON_REDEEM} cr ON cr.coupon_id = cpn.id
      INNER JOIN ${Tables.USERS} u ON cr.user_id = u.id
      LEFT JOIN ${Tables.RESERVATIONS} rev ON rev.coupon_redeem_id = cr.id AND rev.status NOT IN (${CancelledBookingStatus})
      WHERE cpn.id = c.id AND u.status != ${UserStatus.deleted} 
      AND CASE 
      WHEN cr.is_used = ${Bit.one}
      THEN rev.id IS NULL
      ELSE cr.is_used = ${Bit.zero}
      END) AS unused_cpn_count`

    const text = `SELECT ${columns},${assignedCouponCountQuery},${unUsedCouponCountQuery} 
    FROM ${Tables.COUPONS} c 
    LEFT JOIN ${Tables.ORGANIZATIONS} o ON o.id = c.organization_id
    LEFT JOIN ${Tables.CAMPAIGN} camp ON c.id = camp.coupon_id
    WHERE ${condition} ${pagination}`;

    const countText = `SELECT Count(DISTINCT c.id) AS count 
    FROM ${Tables.COUPONS} c
    LEFT JOIN ${Tables.ORGANIZATIONS} o ON o.id = c.organization_id
    LEFT JOIN ${Tables.CAMPAIGN} camp ON c.id = camp.coupon_id
    WHERE ${condition}`;

    const statement = {
      text,
      values,
      rowsOnly: true
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

  }

  static async findTotalUseByCouponId(coupon_id) {
    const statement = {
      text: `SELECT COUNT(id) as count FROM ${Tables.COUPON_REDEEM} where coupon_id = ? and deleted_at is null ;`,
      values: [coupon_id],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async couponCodeExists(couponCode) {
    const statement = {
      text: `SELECT COUNT(id) as count FROM ${Tables.COUPONS} where coupon_code = ?;`,
      values: [couponCode],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findIdByCouponCode(couponCode) {
    const statement = {
      text: `SELECT id FROM ${Tables.COUPONS} where coupon_code = ? and deleted_at is null order by id DESC LIMIT 1;`,
      values: [couponCode],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async getTotalVoucher(date) {
    const statement = {
      text: `select COUNT(*) as total_active_voucher_count from ${Tables.COUPONS} WHERE expiration_at >= UNIX_TIMESTAMP(?) ;`,
      values: [date],
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async getVoucherTotalAmount(date, is_nukhba_user, is_pilot) {
    const usrAdvPymtIncompleteBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled]
    const values = []

    let condition = `WHERE r.is_nukhba_user = '${is_nukhba_user}' AND r.is_pilot = '${is_pilot}' `;
    if (date) {
      condition += ` AND r.created_at like ? AND c.discount_type = ? AND c.deleted_at IS NULL AND r.coupon_redeem_id is not null AND r.status NOT IN (${usrAdvPymtIncompleteBookArr})`
      values.push(`${date}%`)
      values.push(CouponDiscountType.FLAT)
    }

    const statement = {
      text: `select COALESCE(SUM(c.discount), 0) as total_voucher_amount from 
      ${Tables.RESERVATIONS} r INNER JOIN ${Tables.USERS} u ON r.user_id = u.id
      join ${Tables.COUPON_REDEEM} cr on r.coupon_redeem_id = cr.id join ${Tables.COUPONS} c on cr.coupon_id = c.id ${condition} `,
      values,
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async getTotalVoucherAmountRedeemed(date, is_nukhba_user, is_pilot) {
    const usrAdvPymtIncompleteBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled]
    const values = []
    let condition = '';
    if (date) {
      condition = ` AND r.created_at like ? `
      values.push(`${date}%`)
    }

    const statement = {
      text: `SELECT COALESCE(SUM(cr.amount), 0) as total_voucher_amount_redeemed 
      from ${Tables.RESERVATIONS} r INNER JOIN ${Tables.USERS} u ON r.user_id = u.id
      join ${Tables.COUPON_REDEEM} cr on r.coupon_redeem_id = cr.id 
      where r.coupon_redeem_id is not null AND r.status NOT IN (${usrAdvPymtIncompleteBookArr}) AND r.is_nukhba_user = '${is_nukhba_user}' AND r.is_pilot = '${is_pilot}' ${condition} `,
      values,
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async getUnusedCoupon(date, is_nukhba_user, is_pilot) {
    const cancelledBookArr = [BookingTrackStatus.rejected, BookingTrackStatus.auto_cancelled, BookingTrackStatus.rejected_by_admin]
    const statement = {
      text: `SELECT COUNT(*) as unused_coupon_count from ${Tables.COUPONS} where expiration_at >= UNIX_TIMESTAMP(?) 
      AND id not in (
        SELECT cr.coupon_id from ${Tables.COUPON_REDEEM} cr INNER JOIN ${Tables.USERS} u ON cr.user_id = u.id
        INNER JOIN ${Tables.RESERVATIONS} r ON cr.id = r.coupon_redeem_id
        WHERE r.is_nukhba_user = '${is_nukhba_user}' AND r.is_pilot = '${is_pilot}'
        AND cr.is_used = '${Bit.one}' AND r.created_at LIKE ? AND r.status NOT IN (${cancelledBookArr})
      );`,
      values: [date, `${date}%`],
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async getExpiredCoupon(date) {
    const statement = {
      text: `SELECT COUNT(*) as expired_coupon_count from ${Tables.COUPONS} where expiration_at < UNIX_TIMESTAMP(?) AND deleted_at IS NULL;`,
      values: [date],
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async checkIfCouponAssigned(coupon_id, transaction = null) {
    const statement = {
      text: `SELECT COUNT(cr.id) AS count 
        FROM ${Tables.COUPON_REDEEM} cr 
        INNER JOIN ${Tables.COUPONS} cpn ON cr.coupon_id = cpn.id 
        WHERE cpn.uid = ?;`,
      values: [coupon_id],
      transaction
    }
    const result = await db.query(statement);
    return result.rows[0].count || 0
  }

}

module.exports = CouponsModel;


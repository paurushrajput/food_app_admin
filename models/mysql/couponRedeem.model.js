const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, CouponStatus } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");

class CouponRedeemModel {

  static async insert(couponRedeem) {
    const statement = { ...insertData(Tables.COUPON_REDEEM, couponRedeem), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.COUPON_REDEEM} table`
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.COUPON_REDEEM, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.COUPON_REDEEM} table`
    };
  }

  static async findCouponUser(data) {
    const { coupon_id, is_used, on_boarding_start, on_boarding_end, transaction } = data;
    const values = [coupon_id, is_used];
    let condition = ' u.status <> 0 ';

    if (!isEmptyField(on_boarding_start)) {
      condition += ` AND DATE_FORMAT(u.on_boarding_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(on_boarding_start);
    }
    
    if (!isEmptyField(on_boarding_end)) {
      condition += ` AND DATE_FORMAT(u.on_boarding_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(on_boarding_end);
    }

    const statement = {
      text: `SELECT cr.user_id as id FROM ${Tables.COUPON_REDEEM} cr JOIN ${Tables.USERS} u on cr.user_id = u.id WHERE cr.coupon_id = ? AND cr.is_used = ?
      AND ${condition}`,
      values,
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async getCouponRedeemById(id, transaction = null) {
    const statement = {
      text: `SELECT cr.id, cr.uid, cr.user_id, cr.coupon_id, cr.is_used, cr.amount
        FROM ${Tables.COUPON_REDEEM} cr
        WHERE cr.id = ?`,
      values: [id],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

}

module.exports = CouponRedeemModel;
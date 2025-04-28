const { db, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, UNSUBSCRIBE_TYPE, Bit } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");
const DatabaseError = require("../../error/databaseError");

class UserCouponModel {
  static async insert(data, transaction) {
    const statement = { ...insertData(Tables.USER_COUPONS, data), operation: Operations.INSERT, transaction };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.USER_COUPONS} table`
    };
  }

  static async updateOneByID(columns, id, transaction) {
    const statement = { ...updateSingle(Tables.USER_COUPONS, columns, id), operation: Operations.UPDATE, transaction };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.USER_COUPONS} table`
    };
  }

  static async findUserCoupon(data, transaction) {
    const { couponId, userId } = data;
    const values = [];
    let condition = `WHERE cu.deleted_at IS NULL /*AND cu.count > ${Bit.zero}*/`;

    if (!isEmptyField(couponId)) {
      condition += ` AND cu.coupon_id = ?`
      values.push(couponId);
    }
    
    if (!isEmptyField(userId)) {
      condition += ` AND cu.user_id = ?`
      values.push(userId);
    }

    const statement = {
      text: `SELECT cu.id, cu.uid, cu.count
        FROM ${Tables.USER_COUPONS} cu ${condition} ORDER BY id ASC LIMIT 1`,
      values,
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async allocateCouponsToUser({ user_id, coupon_id, count = 1 }, transaction) {
    let text = `SELECT id, uid, user_id, coupon_id, count from ${Tables.USER_COUPONS} WHERE user_id = ? AND coupon_id = ? AND deleted_at IS NULL;`
    const statement = {
      text,
      values: [user_id, coupon_id],
      rowsOnly: true,
      transaction,
    }

    const result = await db.query(statement);
    const [userCoupon] = result.rows;
    if (!userCoupon) {
      const userCouponObj = {
        user_id,
        coupon_id,
        count
      }

      const { rows } = await UserCouponModel.insert(userCouponObj, transaction);
      if (rows < 1) {
        throw new DatabaseError("Unable to insert user coupon")
      }
      return {
        msg: 'Coupon allocated successfully',
        success: true
      }
    } else {
      //update coupon count
      const userCouponUpdateObj = {
        count: Number(userCoupon.count) + count
      }
      const { rows } = await UserCouponModel.updateOneByID(userCouponUpdateObj, userCoupon.id, transaction);
      if (rows < 1) {
        throw new DatabaseError("Unable to insert user coupon")
      }
      return {
        msg: 'Coupon allocated successfully',
        success: true
      }
    }
  };
}

module.exports = UserCouponModel;
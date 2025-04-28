const { db, inMapper } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Status, Bit } = require("../../constants/database");

class UserEventsModel {

  static async findReferralCoins({ eventType, transaction }) {
    const statement = {
      text: `SELECT user_id, JSON_ARRAYAGG(JSON_OBJECT('referral_user_id',referral_user_id, 'id', id, 'created_at', created_at)) AS data FROM ${Tables.USER_EVENTS} WHERE event_type = ? AND coin_paid_at IS NULL AND (is_ignore IS NULL OR is_ignore = ${Bit.zero}) AND deleted_at IS NULL GROUP BY user_id HAVING COUNT(referral_user_id) > 0;`,
      values: [eventType],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findOnlyId({ eventType, transaction, userId }) {
    const statement = {
      text: `SELECT id FROM ${Tables.USER_EVENTS} WHERE event_type = ? AND user_id = ? AND coin_paid_at IS NULL AND (is_ignore IS NULL OR is_ignore = ${Bit.zero}) AND deleted_at IS NULL;`,
      values: [eventType, userId],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }


  static async findResturantRatingCoins({ eventType, transaction }) {
    const statement = {
      text: `SELECT user_id, JSON_ARRAYAGG(JSON_OBJECT('restaurant_id',restaurant_id, 'id', id, 'created_at', created_at)) AS data FROM ${Tables.USER_EVENTS} WHERE event_type = ? AND coin_paid_at IS NULL AND (is_ignore IS NULL OR is_ignore = ${Bit.zero}) AND deleted_at IS NULL GROUP BY user_id HAVING COUNT(restaurant_id) > 0;`,
      values: [eventType],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async getPreBookingCoins({ eventType, transaction }) {
    const statement = {
      text: `SELECT 
          user_id, JSON_ARRAYAGG(JSON_OBJECT('restaurant_id',restaurant_id, 'id', id, 'reservation_id', reservation_id, 'created_at', created_at)) AS data 
        FROM ${Tables.USER_EVENTS} 
        WHERE 
          event_type = ? AND 
          coin_paid_at IS NULL AND 
          (is_ignore IS NULL OR is_ignore = ${Bit.zero}) AND 
          deleted_at IS NULL 
        GROUP BY user_id HAVING COUNT(restaurant_id) > 0;`,
      values: [eventType],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async getInstantPaymentCoins({ eventType, transaction }) {
    const statement = {
      text: `SELECT 
          user_id, JSON_ARRAYAGG(JSON_OBJECT('restaurant_id',restaurant_id, 'id', id, 'reservation_id', reservation_id, 'created_at', created_at)) AS data 
        FROM ${Tables.USER_EVENTS} 
        WHERE 
          event_type = ? AND 
          coin_paid_at IS NULL AND 
          (is_ignore IS NULL OR is_ignore = ${Bit.zero}) AND 
          deleted_at IS NULL 
        GROUP BY user_id HAVING COUNT(restaurant_id) > 0;`,
      values: [eventType],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async getReferredUserDiningCoins({ eventType, transaction }) {
    const statement = {
      text: `SELECT 
          user_id, JSON_ARRAYAGG(JSON_OBJECT('restaurant_id',restaurant_id, 'id', id, 'reservation_id', reservation_id, 'created_at', created_at, 'referral_user_id', referral_user_id)) AS data 
        FROM ${Tables.USER_EVENTS} 
        WHERE 
          event_type = ? AND 
          coin_paid_at IS NULL AND 
          (is_ignore IS NULL OR is_ignore = ${Bit.zero}) AND 
          deleted_at IS NULL 
        GROUP BY user_id HAVING COUNT(restaurant_id) > 0;`,
      values: [eventType],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async getDealPurchaseCoins({ eventType, transaction }) {
    const statement = {
      text: `SELECT 
          user_id, JSON_ARRAYAGG(JSON_OBJECT('restaurant_id',restaurant_id, 'id', id, 'deal_id', deal_id, 'created_at', created_at)) AS data 
        FROM ${Tables.USER_EVENTS} 
        WHERE 
          event_type = ? AND 
          coin_paid_at IS NULL AND 
          (is_ignore IS NULL OR is_ignore = ${Bit.zero}) AND 
          deleted_at IS NULL 
        GROUP BY user_id HAVING COUNT(restaurant_id) > 0;`,
      values: [eventType],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }


  static async markAsProcessed({ ids, transaction }) {
    if (!Array.isArray(ids)) ids = [ids];
    const statement = {
      text: `UPDATE ${Tables.USER_EVENTS} SET coin_paid_at = NOW() WHERE id IN (${inMapper(ids)});`,
      values: [],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async markAsIgnore({ ids, transaction }) {
    if (!Array.isArray(ids)) ids = [ids];
    const statement = {
      text: `UPDATE ${Tables.USER_EVENTS} SET is_ignore = ? WHERE id IN (${inMapper(ids)});`,
      values: [Bit.one],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async checkMonthlyLimit({ eventType, from, to, transaction, userId }) {
    const statement = {
      text: `SELECT id FROM ${Tables.USER_EVENTS} WHERE coin_paid_at IS NOT NULL 
      AND event_type = ?
      AND user_id = ?
      AND (is_ignore IS NULL OR is_ignore = ${Bit.zero})
      AND deleted_at IS NULL 
      AND created_at BETWEEN ? AND ? ORDER BY id ASC;`,
      values: [eventType, userId, from, to],
      transaction
    }
    const result = await db.query(statement);
    return result.rows;
  }

}

module.exports = UserEventsModel;
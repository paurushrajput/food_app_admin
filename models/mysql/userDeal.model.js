const {
  db,
  inMapper,
  insertData,
  updateSingle,
} = require("../../dbConfig/dbConnect.js");

const { Tables, Operations, UserDealStatus, Bit } = require("../../constants/database.js");

const { isEmptyField } = require("../../utils/common.js");
const { OrderStatusCode, PaymentStatus } = require("../../constants/payments.js");

class UserDealModel {

  static async getOneByDealId(deal_id, transaction) {
    const statement = {
      text: `SELECT COUNT(ud.id) as count FROM ${Tables.USER_DEAL} ud JOIN ${Tables.DEAL_OPTION} do ON ud.deal_option_id = do.id JOIN ${Tables.DEALS} d on do.deal_id = d.id WHERE d.id = ? AND deleted_at IS NULL;`,
      values: [deal_id],
      transaction
    };
    const result = await db.query(statement);
    return result.rows;
  }

  static async list(body) {
    const { 
      sort, 
      offset, 
      limit, 
      is_paginated, 
      quantity, 
      is_pilot, 
      user_id, 
      deal_option_id, 
      deal_id, 
      username, 
      payment_status, 
      from_date, 
      to_date, 
      user_email, 
      user_mobile, 
      restaurant_id, 
      restaurant_branch_id,
      user_deal_status,
      created_at_from_date,
      created_at_to_date,
      redeemed_at_from_date,
      redeemed_at_to_date,
      type,
      booking_id,
      order_status_code
    } = body;

    let condition = `WHERE ud.deleted_at IS NULL `;
    const values = [];
    const countValues = [];

    let pagination = `ORDER BY ud.${sort} limit ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY ud.${sort}`;
    }

    if (!isEmptyField(quantity)) {
      condition += ` AND (ud.quantity = ?  )`
      values.push(quantity);
      countValues.push(quantity);
    }

    if (!isEmptyField(is_pilot)) {
      condition += ` AND (ud.is_pilot = ?  )`
      values.push(is_pilot);
      countValues.push(is_pilot);
    }

    if (!isEmptyField(user_id)) {
      condition += ` AND (u.uid = ?  )`
      values.push(user_id);
      countValues.push(user_id);
    }

    if (!isEmptyField(deal_id)) {
      condition += ` AND (d.uid = ?  )`
      values.push(deal_id);
      countValues.push(deal_id);
    }

    if (!isEmptyField(deal_option_id)) {
      condition += ` AND (do.uid = ?  )`
      values.push(deal_option_id);
      countValues.push(deal_option_id);
    }

    if (!isEmptyField(username)) {
      condition += ` AND (LOWER(u.first_name) LIKE LOWER(?) OR LOWER(u.last_name) LIKE LOWER(?) )`
      values.push(`%${username}%`,`%${username}%`);
      countValues.push(`%${username}%`,`%${username}%`);
    }

    if (!isEmptyField(payment_status)) {
      condition += ` AND (p.status = ? )`
      values.push(payment_status);
      countValues.push(payment_status);
    }

    if (!isEmptyField(from_date)) {
      condition += ` AND d.start_time >= ? `
      values.push(from_date);
      countValues.push(from_date);
    }

    if (!isEmptyField(to_date)) {
      condition += ` AND d.end_time <= ? `
      values.push(to_date);
      countValues.push(to_date);
    }

    if (!isEmptyField(booking_id)) {
      condition += ` AND ud.uid = ? `
      values.push(booking_id);
      countValues.push(booking_id);
    }

    if (!isEmptyField(created_at_from_date) && !isEmptyField(created_at_to_date)  ) {
      condition += ` AND DATE_FORMAT(ud.created_at,'%Y-%m-%d %H:%i:%s') >= ? AND 
      DATE_FORMAT(ud.created_at,'%Y-%m-%d %H:%i:%s') <=  ?
      `
      values.push(created_at_from_date,created_at_to_date);
      countValues.push(created_at_from_date,created_at_to_date);
    }

    if (!isEmptyField(redeemed_at_from_date) && !isEmptyField(redeemed_at_to_date)  ) {
      condition += ` AND DATE_FORMAT(ud.redeemed_at,'%Y-%m-%d %H:%i:%s') >= ? AND 
      DATE_FORMAT(ud.redeemed_at,'%Y-%m-%d %H:%i:%s') <=  ? `
      values.push(redeemed_at_from_date,redeemed_at_to_date);
      countValues.push(redeemed_at_from_date,redeemed_at_to_date);
    }

    if (!isEmptyField(type)) {
      condition += ` AND ud.type = ? `
      values.push(type);
      countValues.push(type);
    }

    if (!isEmptyField(user_email)) {
      condition += ` AND (LOWER(u.email) LIKE LOWER(?) )`
      values.push(`%${user_email}%`);
      countValues.push(`%${user_email}%`);
    }

    if (!isEmptyField(user_mobile)) {
      condition += ` AND (u.mobile LIKE ? )`
      values.push(`%${user_mobile}%`);
      countValues.push(`%${user_mobile}%`);
    }

    if (!isEmptyField(order_status_code) && order_status_code !== OrderStatusCode.redeemed ) {
      if(order_status_code === OrderStatusCode.paid || order_status_code === OrderStatusCode.pending  ){
        condition += ` AND p.order_status_code = ? AND ud.redeemed_at IS NULL AND p.status NOT IN (${PaymentStatus.clickedBack.value})  `
        values.push(`${order_status_code}`);
        countValues.push(`${order_status_code}`);
      }else if(!isEmptyField(order_status_code) && order_status_code == PaymentStatus.clickedBack.value ){
        condition += ` AND  p.status = ? `
        values.push(`${order_status_code}`);
        countValues.push(`${order_status_code}`);
      }else{
        condition += ` AND  p.order_status_code = ? AND p.status NOT IN (${PaymentStatus.clickedBack.value})  `
        values.push(`${order_status_code}`);
        countValues.push(`${order_status_code}`);
      }
      
    }

    if (!isEmptyField(order_status_code) && order_status_code === OrderStatusCode.redeemed ) {
      condition += ` AND  ud.redeemed_at IS NOT NULL `
    }

    if (!isEmptyField(restaurant_id)) {
      condition += ` AND (r.uid = ? )`
      values.push(restaurant_id);
      countValues.push(restaurant_id);
    }

    if (!isEmptyField(restaurant_branch_id)) {
      condition += ` AND r2.uid = ?`
      values.push(restaurant_branch_id);
      countValues.push(restaurant_branch_id);
    }

    if (!isEmptyField(user_deal_status) && Number(user_deal_status) != UserDealStatus.expired) {
      condition += ` AND (ud.status = ?)`
      values.push(Number(user_deal_status));
      countValues.push(Number(user_deal_status));
    } else if(!isEmptyField(user_deal_status) && Number(user_deal_status) == UserDealStatus.expired){
      condition += ` AND (ud.end_time < UNIX_TIMESTAMP() AND ud.status = ?)`
      values.push(UserDealStatus.payment_completed);
      countValues.push(UserDealStatus.payment_completed);
    }

    const statement = {
      text: `SELECT 
        ud.uid as id, 
        u.uid AS user_id, 
        COALESCE(u.first_name, "") AS username,
        ud.deal_option_id, 
        ud.quantity,
        ud.details AS user_deal_details,
        CAST(ud.is_pilot AS SIGNED) AS is_pilot,
        CASE WHEN ud.end_time < UNIX_TIMESTAMP() THEN true ELSE false END AS is_expired,
        ud.created_at,
        ud.deleted_at,
        d.uid as deal_id,
        d.type as deal_type,
        d.title as deal_title,
        do.uid as deal_option_id,
        do.title as deal_option_title,
        p.status as payment_status,
        ud.status as user_deal_status,
        ud.type as user_deal_type,
        u.status as user_status,
        ud.end_time,
        r.name as restaurant_name,
        ud.redeemed_at,
        JSON_EXTRACT(ud.details, '$."selected_restaurant"') as selected_restaurant,
        p.other_details as payment_other_details,
        p.ref_txn_id as ref_txn_id,
        TIME_FORMAT(dl.start_time, '%h:%i %p') AS slot_start_time,
        TIME_FORMAT(dl.end_time, '%h:%i %p') AS slot_end_time,
        dl.interval_in_mins as slot_interval_in_mins,
        p.order_status_code
        FROM ${Tables.USER_DEAL} ud
        JOIN ${Tables.DEAL_OPTION} do ON ud.deal_option_id = do.id 
        JOIN ${Tables.DEALS} d ON do.deal_id = d.id 
        JOIN ${Tables.RESTAURANTS} r ON d.restaurant_id = r.id 
        LEFT JOIN ${Tables.RESTAURANTS} r2 ON ud.redeemed_res_id = r2.id 
        JOIN ${Tables.USERS} u ON u.id = ud.user_id 
        LEFT JOIN ${Tables.PAYMENTS} p ON ud.payment_id = p.id 
        LEFT JOIN ${Tables.DEAL_SLOT} dl ON ud.slot_id = dl.id 
        ${condition} ${pagination};`,
      values: values,
      rowsOnly: true,
    }

    const countText = `SELECT count(d.id) as count FROM ${Tables.USER_DEAL} ud
      JOIN ${Tables.DEAL_OPTION} do ON ud.deal_option_id = do.id 
      JOIN ${Tables.DEALS} d ON do.deal_id = d.id 
      JOIN ${Tables.RESTAURANTS} r ON d.restaurant_id = r.id 
      LEFT JOIN ${Tables.RESTAURANTS} r2 ON ud.redeemed_res_id = r2.id 
      JOIN ${Tables.USERS} u ON u.id = ud.user_id 
      LEFT JOIN ${Tables.PAYMENTS} p ON ud.payment_id = p.id 
      ${condition};`;

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
}

module.exports = UserDealModel;

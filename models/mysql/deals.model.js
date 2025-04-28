const {
  db,
  inMapper,
  insertData,
  updateSingle,
} = require("../../dbConfig/dbConnect.js");
const { Tables, Operations, UserDealStatus, } = require("../../constants/database.js");
const { isEmptyField } = require("../../utils/common.js");

class DealsModel {

  static async list(body) {
    const { sort, from_date, to_date, offset, limit, is_paginated, title, description, restaurant_id, category_id, days_validity, status, device_check, sold_out } = body;

    let condition = `WHERE d.deleted_at IS NULL /*AND ((UNIX_TIMESTAMP() BETWEEN d.start_time AND d.end_time) OR (UNIX_TIMESTAMP() < d.start_time))*/`;
    const values = [];
    const countValues = [];

    let pagination = `ORDER BY ${sort} limit ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY ${sort}`;
    }

    if (!isEmptyField(title)) {
      condition += ` AND (d.title LIKE ?  )`
      values.push(`%${title}%`);
      countValues.push(`%${title}%`);
    }

    if (!isEmptyField(description)) {
      condition += ` AND (d.description LIKE ?  )`
      values.push(`%${description}%`);
      countValues.push(`%${description}%`);
    }

    if (!isEmptyField(restaurant_id)) {
      condition += ` AND (r.uid LIKE ?  )`
      values.push(`%${restaurant_id}%`);
      countValues.push(`%${restaurant_id}%`);
    }

    if (!isEmptyField(sold_out)) {
      condition += ` AND (d.sold_out = ? )`
      values.push(sold_out);
      countValues.push(sold_out);
    }

    if (!isEmptyField(category_id)) {
      condition += ` AND (c.uid LIKE ?  )`
      values.push(`%${category_id}%`);
      countValues.push(`%${category_id}%`);
    }

    if (!isEmptyField(from_date)) {
      condition +=  ` AND DATE_FORMAT(ADDTIME(FROM_UNIXTIME(d.start_time), '00:00:00'),'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }

    if (!isEmptyField(to_date)) {
      condition +=  ` AND DATE_FORMAT(ADDTIME(FROM_UNIXTIME(d.end_time), '00:00:00'),'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }

    if (!isEmptyField(days_validity)) {
      condition += ` AND d.days_validity = ? `
      values.push(days_validity);
      countValues.push(days_validity);
    }

    if (!isEmptyField(status)) {
      condition += ` AND d.status = ? `
      values.push(Number(status));
      countValues.push(Number(status));
    }

    if (!isEmptyField(device_check)) {
      condition += ` AND d.device_check = ? `
      values.push(Number(device_check));
      countValues.push(Number(device_check));
    }

    const statement = {
      text: `SELECT 
        d.uid as id, 
        d.title, 
        d.days_validity,
        d.description, 
        d.start_time,
        d.end_time,
        d.images,
        d.start_time, 
        d.end_time, 
        d.created_at,
        d.deleted_at,
        d.details,
        d.status,
        d.sold_out,
        d.type,
        d.sequence,
        d.is_locked,
        d.device_check,
        d.template,
        CAST(d.free_with_nukhba_credits AS SIGNED) AS free_with_nukhba_credits,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', uid, 'start_at', start_time, 'end_at', end_time, 'interval_in_mins',interval_in_mins)) FROM
        ${Tables.DEAL_SLOT} WHERE deal_id = d.id AND deleted_at IS NULL) AS slots,
        d.days,
        d.exclude_dates,
        JSON_EXTRACT(d.details, '$.lock_conditions') AS lock_conditions,
        CAST(d.is_pilot AS SIGNED) AS is_pilot,
        d.home_image,
        r.uid as restaurant_id,
        r.name as restaurant_name,
        r.type as restaurant_type,
        (
          SELECT JSON_ARRAYAGG(c.uid) from ${Tables.DEAL_CATEGORIES} dc  
          LEFT JOIN ${Tables.CATEGORIES} c ON dc.cat_id = c.id
          WHERE  dc.deal_id = d.id 
        ) as deal_categories,
        (SELECT COUNT(*) FROM ${Tables.USER_DEAL} WHERE deal_id = d.id AND deleted_at IS NULL) AS booking_count,
        CASE WHEN d.start_time > UNIX_TIMESTAMP() THEN true ELSE false END AS is_upcoming,
        CASE WHEN d.end_time < UNIX_TIMESTAMP() THEN true ELSE false END AS is_expired,
        JSON_OBJECT('uid', camp.uid, 'title', camp.title) AS campaign,
        IF(camp.uid is null, null, JSON_OBJECT('uid', camp.uid, 'title', camp.title)) AS campaign
        FROM ${Tables.DEALS} d
        LEFT JOIN ${Tables.RESTAURANTS} r ON d.restaurant_id = r.id 
        LEFT JOIN ${Tables.CAMPAIGN} camp ON camp.id = d.campaign_id
        ${condition} ${pagination};`,
      values: values,
      rowsOnly: true,
    }

    const countText = `SELECT count(d.id) as count FROM ${Tables.DEALS} d ${condition};`;

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

  static async insert(deals, transaction) {
    const statement = {
      ...insertData(Tables.DEALS, deals),
      operation: Operations.INSERT,
      transaction
    };
    const result = await db.query(statement);
    const affectedRows = Number(
      JSON.parse(JSON.stringify(result))?.rows?.affectedRows
    );
    const insertId = Number(
      JSON.parse(JSON.stringify(result))?.rows?.insertId
    );

    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.DEALS} table`,
      lastInsertedId: insertId,
    };
  }

  static async updateOneById(columns, id, transaction) {
    const statement = {
      ...updateSingle(Tables.DEALS, columns, id),
      operation: Operations.UPDATE,
      transaction
    };
    const result = await db.query(statement);
    const affectedRows = Number(
      JSON.parse(JSON.stringify(result))?.rows?.affectedRows
    );
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.DEALS} table`,
    };
  }

  static async getOneByuId(uid, transaction) {
    const statement = {
      text: `SELECT id, uid, title, description, images, start_time, end_time, restaurant_id, category_id, type, days_validity, details, CAST(is_pilot AS SIGNED) AS is_pilot,
      CAST(free_with_nukhba_credits AS SIGNED) AS free_with_nukhba_credits,   template FROM ${Tables.DEALS} where uid = ?;`,
      values: [uid],
      transaction
    };
    const result = await db.query(statement);
    return result.rows;
  }

  static async getOneById(id, transaction) {
    const statement = {
      text: `SELECT id, title, description, images, start_time, end_time, restaurant_id, category_id, template FROM ${Tables.DEALS} where id = ? ;`,
      values: [id],
      transaction
    };
    const result = await db.query(statement);
    return result.rows;
  }

  static async findOneByName(title, transaction) {
    const statement = {
      text: `SELECT id, title FROM ${Tables.DEALS} where LOWER(title) = LOWER(?) and deleted_at is null;`,
      values: [title],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findDealsCreated(date) {
    const statement = {
      text: `SELECT COUNT(id) as count FROM ${Tables.DEALS} where DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') = ? and deleted_at is null;`,
      values: [date],
    }
    const result = await db.query(statement);
    return result.rows[0]
  }

  static async findActiveDeals() {
    const statement = {
      text: `SELECT COUNT(id) as count FROM ${Tables.DEALS} WHERE NOW() BETWEEN FROM_UNIXTIME(start_time) AND FROM_UNIXTIME(end_time);`,
      values: [],
    }
    const result = await db.query(statement);
    return result.rows[0]
  }

  static async findSoldDeals(date) {
    const statement = {
      text: `select COALESCE(SUM(quantity),0) as total from ${Tables.USER_DEAL} where DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') = ? and deleted_at is null;`,
      values: [date],
    }
    const result = await db.query(statement);
    return result.rows[0]
  }

  static async findRedeemedDeals(date) {
    const statement = {
      text: `select COUNT(id) as count from ${Tables.USER_DEAL} where DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') = ? and status = ? and deleted_at is null;`,
      values: [date, UserDealStatus.redeemed],
    }
    const result = await db.query(statement);
    return result.rows[0]
  }

  static async updateImages(body, id) {
    const { images = "" } = body;

    const statement = {
      text: `UPDATE ${Tables.DEALS} SET images = JSON_SET(images, '$', JSON_MERGE('[]', '[${images}]')) WHERE id = ?;`,
      values: [id],
      operation: Operations.UPDATE,
    };

    const result = await db.query(statement);
    const affectedRows = Number(
      JSON.parse(JSON.stringify(result))?.rows?.affectedRows
    );

    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.DEALS} table`,
    };
  }

  static async getAllDealForScript(){
    let condition = ` WHERE deleted_at IS NULL `
    const query = `
    SELECT id,uid,title,category_id FROM deals ${condition} ;
    `
    const statement = {
      text: query,
      values: [],
      operation: Operations.SELECT,
    };

    const countQuery = `
    SELECT COUNT(*)  as count FROM deals ${condition} ;
    `
    const countStatement = {
      text: countQuery,
      values: [],
      operation: Operations.SELECT,
    };

    const listPr = db.query(statement);
    const countPr = db.query(countStatement);

    const promiseData = await Promise.all([listPr, countPr]);

    return {
      count: promiseData[1]?.rows[0]?.count,
      rows: promiseData[0]?.rows,
    }
  }
}

module.exports = DealsModel;

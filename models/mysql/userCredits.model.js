const { db, inMapper, insertData, updateSingle, updateMultiple } = require("../../dbConfig/dbConnect");
const { 
  Tables, 
  Operations, 
  UnknownUser, 
  Status, 
  Bit, 
  CASHOUT_APPROVED_STATUS, 
  USER_CREDIT_TYPE, 
  USER_CREDIT_STATUS,
  USER_POINTS_TYPE,
  USER_TYPE
} = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");

class UserCreditsModel {
  static async insert(data, transaction = null) {
    const statement = { ...insertData(Tables.USER_CREDITS, data), operation: Operations.INSERT, transaction };
    const result = await db.query(statement, false);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      // lastInsertId: result.lastInsertId,
      lastInsertId: result?.rows?.insertId,
      msg: `${affectedRows} rows inserted into ${Tables.USER_CREDITS} table`
    };
  }

  static async updateOneById(columns, id, transaction = null) {
    const statement = { ...updateSingle(Tables.USER_CREDITS, columns, id), operation: Operations.UPDATE, transaction };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.USER_CREDITS} table`
    };
  }

  
  static async updateManyById(columns, ids, transaction = null) {
    const statement = { ...updateMultiple(Tables.USER_CREDITS, columns, ids), operation: Operations.UPDATE, transaction };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.USER_CREDITS} table`
    };
  }

  static async getOneByColumn(body, transaction = null) {
    const { column = 'id', value = "" } = body;

    let text = `SELECT id, uid, user_id, amount from ${Tables.USER_CREDITS} WHERE ${column} = ? AND deleted_at IS NULL;`

    const statement = {
      text,
      values: [value],
      rowsOnly: true,
      transaction
    }

    const result = await db.query(statement);

    return result.rows;
  };

  static async getOneByColumns(body) {
    const { columns = ['id'], values = [""] } = body;
    let columnsString = ``
    columns.map(el => {
      columnsString += `${el} = ? AND `
    })

    const columnsStringLastIndex = columnsString.trim().lastIndexOf('AND');
    columnsString = columnsString.substr(0, columnsStringLastIndex);

    let text = `SELECT id, uid, name, email, phone_number from ${Tables.USER_CREDITS} WHERE ${columnsString} AND deleted_at IS NULL;`

    const statement = {
      text,
      values: [...values],
      rowsOnly: true,
    }

    const result = await db.query(statement);

    return result.rows;
  };

  static async list(body) {
    const {
      sort, 
      limit, 
      offset, 
      is_paginated,
      keyword, 
      from_date, 
      to_date, 
      id,
      approved_status,
      credit_type,
      user_id,
      user
    } = body;

    let condition = `WHERE uc.deleted_at IS NULL AND uc.type = ?`;
    const values = [credit_type];
    const countValues = [credit_type];

    let pagination = `ORDER BY ${sort} limit ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY ${sort}`;
    }

    if(!isEmptyField(keyword)){
      condition += ` AND (usr.first_name LIKE ? OR usr.email LIKE ?)`
      values.push(`%${keyword}%`,`%${keyword}%`);
      countValues.push(`%${keyword}%`,`%${keyword}%`);
    }
    if(!isEmptyField(from_date)){
      condition += ` AND DATE_FORMAT(uc.created_at,'%Y-%m-%d') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }
    if(!isEmptyField(to_date)){
      condition += ` AND DATE_FORMAT(uc.created_at,'%Y-%m-%d') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }
    if(!isEmptyField(id)){
      condition += ` AND uc.uid = ?`
      values.push(id);
      countValues.push(id);
    }
    if(!isEmptyField(approved_status)){
      condition += ` AND uc.approved_status = ?`
      values.push(approved_status);
      countValues.push(approved_status);
    }
    if(!isEmptyField(user_id)){
      condition += ` AND usr.uid = ?`
      values.push(user_id);
      countValues.push(user_id);
    }

    const statement = {
      text: `SELECT
        uc.id,
        uc.uid,
        uc.amount,
        uc.usable_amount,
        uc.expiration_at,
        CASE WHEN uc.expiration_at < UNIX_TIMESTAMP() THEN true ELSE false END AS is_expired,
        uc.type,
        uc.approved_status,
        UNIX_TIMESTAMP(uc.created_at) AS created_at,
        uc.status,
        uc.other_details,
        uc.cashout_type,
        up.points,
        JSON_OBJECT('name', usr.first_name, 'email', usr.email, 'country_code', usr.country_code, 'mobile', usr.mobile) AS user
        FROM ${Tables.USER_CREDITS} uc
        LEFT JOIN ${Tables.USER_POINTS} up ON up.user_credit_id = uc.id /*AND up.points_type = '${USER_POINTS_TYPE.CASHOUT}'*/
        LEFT JOIN ${Tables.USERS} usr ON uc.user_id = usr.id
        ${condition} ${pagination};`,
      values: values,
      rowsOnly: true,
    }

    const countText = `SELECT COUNT(*) As count 
    FROM ${Tables.USER_CREDITS} uc 
    LEFT JOIN ${Tables.USER_POINTS} up ON up.user_credit_id = uc.id /*AND up.points_type = '${USER_POINTS_TYPE.CASHOUT}'*/
    LEFT JOIN ${Tables.USERS} usr ON uc.user_id = usr.id
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

  static async listConvertHistory(body) {
    const {
      sort, 
      limit, 
      offset, 
      is_paginated,
      keyword, 
      from_date, 
      to_date, 
      id,
      approved_status,
      credit_type,
      user_id,
      user
    } = body;

    let condition = `WHERE uc.deleted_at IS NULL AND uc.type = ?`;
    const values = [credit_type];
    const countValues = [credit_type];

    let pagination = `ORDER BY ${sort} limit ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY ${sort}`;
    }

    // if(!isEmptyField(keyword)){
    //   condition += ` AND (dl.title LIKE ? OR rt.name LIKE ?)`
    //   values.push(`%${keyword}%`,`%${keyword}%`);
    //   countValues.push(`%${keyword}%`,`%${keyword}%`);
    // }
    if(!isEmptyField(from_date)){
      condition += ` AND DATE_FORMAT(uc.created_at,'%Y-%m-%d') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }
    if(!isEmptyField(to_date)){
      condition += ` AND DATE_FORMAT(uc.created_at,'%Y-%m-%d') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }
    if(!isEmptyField(id)){
      condition += ` AND uc.uid = ?`
      values.push(id);
      countValues.push(id);
    }
    if(!isEmptyField(approved_status)){
      condition += ` AND uc.approved_status = ?`
      values.push(approved_status);
      countValues.push(approved_status);
    }
    if(!isEmptyField(user_id)){
      condition += ` AND uc.user_id = ?`
      values.push(user_id);
      countValues.push(user_id);
    }

    const statement = {
      text: `SELECT
        uc.id,
        uc.uid,
        uc.amount,
        uc.usable_amount,
        uc.expiration_at,
        CASE WHEN uc.expiration_at < UNIX_TIMESTAMP() THEN true ELSE false END AS is_expired,
        uc.type,
        uc.approved_status,
        UNIX_TIMESTAMP(uc.created_at) AS created_at,
        uc.status,
        uc.other_details,
        uc.cashout_type,
        up.points
        FROM ${Tables.USER_CREDITS} uc
        LEFT JOIN ${Tables.USER_POINTS} up ON up.user_credit_id = uc.id /*AND up.points_type = '${USER_POINTS_TYPE.CASHOUT}'*/
        ${condition} ${pagination};`,
      values: values,
      rowsOnly: true,
    }

    const countText = `SELECT COUNT(*) As count 
    FROM ${Tables.USER_CREDITS} uc 
    LEFT JOIN ${Tables.USER_POINTS} up ON up.user_credit_id = uc.id /*AND up.points_type = '${USER_POINTS_TYPE.CASHOUT}'*/
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

  static async getCashoutRequest(body, transaction = null) {
    const { column = 'id', value = "" } = body;

    let text = `SELECT 
      uc.id, uc.uid, uc.user_id, uc.amount, uc.cashout_type, uc.approved_status, uc.status, up.points
    FROM ${Tables.USER_CREDITS} uc
    LEFT JOIN ${Tables.USER_POINTS} up ON up.user_credit_id = uc.id AND up.points_type = '${USER_POINTS_TYPE.CASHOUT}'
    WHERE 
      uc.${column} = ? AND 
      uc.deleted_at IS NULL;`

    const statement = {
      text,
      values: [value],
      rowsOnly: true,
      transaction
    }

    const result = await db.query(statement);

    return result.rows;
  };

  static async getPendingRedeemRequest(body, transaction = null) {
    const { column = 'id', value = "" } = body;

    let text = `SELECT 
      uc.id, uc.uid, uc.user_id, uc.amount, uc.cashout_type, uc.approved_status, uc.status, up.points
    FROM ${Tables.USER_CREDITS} uc
    LEFT JOIN ${Tables.USER_POINTS} up ON up.user_credit_id = uc.id AND up.points_type = '${USER_POINTS_TYPE.CONVERT}'
    LEFT JOIN ${Tables.USERS} usr ON uc.user_id = usr.id
    WHERE 
      uc.status = ${USER_CREDIT_STATUS.PENDING} AND 
      uc.deleted_at IS NULL;`

    const statement = {
      text,
      values: [],
      rowsOnly: true,
      transaction
    }

    const result = await db.query(statement);

    return result.rows;
  };

  static async getPendingInfluencerCommissionCredit(body, transaction = null) {
    const { column = 'id', value = "" } = body;
    const columnObj = `JSON_OBJECT('id', up.id, 'uid', up.uid, 'user_id', up.user_id, 
    'influencer_commission', up.influencer_commission, 
    'commission_credited', up.commission_credited, 
    'points', up.points, 
    'referee_id', referee.id, 'referee_type', referee.user_type)
    `
    let text = `SELECT 
      referee.id AS referee_id, 
      referee.total_points AS referee_total_points, 
      MIN(up.id) AS first_id,
      MAX(up.id) AS last_id,
      MIN(up.created_at) AS start_date,
      MAX(up.created_at) AS end_date,
      MONTH(MIN(up.created_at)) AS month,
      SUM(influencer_commission) AS total_influencer_commission, 
      JSON_ARRAYAGG(${columnObj}) AS user_points
    FROM ${Tables.USER_POINTS} up
    LEFT JOIN ${Tables.USERS} usr ON usr.id = up.user_id
    LEFT JOIN ${Tables.USERS} referee ON referee.id = usr.referred_by
    WHERE 
      (up.commission_credited = ${Bit.zero} OR up.commission_credited IS NULL) AND 
      up.influencer_commission IS NOT NULL AND 
      up.points_type NOT IN ('${USER_POINTS_TYPE.CASHOUT}', '${USER_POINTS_TYPE.CONVERT}', '${USER_POINTS_TYPE.INFLUENCER_COMMISSION_CREDIT}') AND
      referee.id IS NOT NULL AND
      referee.user_type = ${USER_TYPE.INFLUENCER} AND
      up.created_at BETWEEN DATE_FORMAT(NOW() ,'%Y-%m-01') AND LAST_DAY(NOW())
    GROUP BY referee.id`

    const statement = {
      text,
      values: [],
      rowsOnly: true,
      transaction
    }

    const result = await db.query(statement);

    return result.rows;
  };
}

module.exports = UserCreditsModel;

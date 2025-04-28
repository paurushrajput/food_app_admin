const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Status } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");

class DialogModel {

  static async insert(dialog, transaction) {
    const statement = { ...insertData(Tables.DIALOG, dialog), operation: Operations.INSERT, transaction };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.DIALOG} table`
    };
  }

  static async list(body) {
    const { sort, limit, offset, is_paginated, keyword, from_date, to_date, id, status } = body;

    let condition = `WHERE d.status = ${Status.one} and d.deleted_at IS NULL`;
    const values = [];
    const countValues = [];

    let pagination = `ORDER BY d.${sort} LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY d.${sort}`;
    }

    if (!isEmptyField(keyword)) {
      condition += ` AND d.title LIKE ?`
      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }
    if(!isEmptyField(from_date)){
      condition += ` AND DATE_FORMAT(d.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }
    if(!isEmptyField(to_date)){
      condition += ` AND DATE_FORMAT(d.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }
    if(!isEmptyField(id)){
      condition += ` and d.uid = ?`
      values.push(id);
      countValues.push(id);
    }
    if (!isEmptyField(status)) {
      condition += ` AND (d.status = ?)`
      values.push(status);
      countValues.push(status);
    }

    // if (start_date && start_date !== "") {
    //   condition += ` AND  >= ?`
    //   values.push(start_date);
    //   countValues.push(start_date);
    // }
    // if (end_date && end_date !== "") {
    //   condition += ` AND d.end_date <= ?`
    //   values.push(end_date);
    //   countValues.push(end_date);
    // }

    const text = `SELECT 
      d.uid AS id, 
      d.title,
      d.message, 
      d.details,
      d.user_type,
      d.start_time, 
      d.end_time, 
      d.status,
      d.created_at,
      COALESCE(CONCAT(m.basePath,'/',m.filename),'') AS image, 
      CAST(d.is_image_close AS SIGNED) AS is_close,
      CASE
          WHEN d.start_time <= UNIX_TIMESTAMP() AND d.end_time >= UNIX_TIMESTAMP() THEN "Active"
          WHEN d.start_time >= UNIX_TIMESTAMP() AND d.end_time >= UNIX_TIMESTAMP() THEN "Scheduled"
          ELSE "Expired"
      END AS status_text
    FROM ${Tables.DIALOG} d
    LEFT JOIN ${Tables.MEDIA} m ON d.image_id = m.id
    ${condition} ${pagination};`
    
    const countText = `SELECT COUNT(d.id) as count 
      FROM ${Tables.DIALOG} d
    ${condition}`;

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

  static async findRunningDialogByColumn(column = "title", value = null, transaction) {
    if(isEmptyField(value))
      return [];

    const statement = {
      text: `SELECT id, uid, title,message,details,start_time,end_time,status,user_type FROM ${Tables.DIALOG} WHERE ${column} = ? AND deleted_at IS NULL AND status = ${Status.one} AND UNIX_TIMESTAMP() BETWEEN start_time AND end_time;`,
      values: [value],
      transaction
    }
    
    const result = await db.query(statement);
    return result.rows
  }

  static async updateOneById(columns, id, dbTransaction) {
    const statement = { ...updateSingle(Tables.DIALOG, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.DIALOG} table`
    };
  }

  static async findOneByuId(uid, transaction) {
    const statement = {
      text: `SELECT id,title,message,details,status, start_time, end_time FROM ${Tables.DIALOG} WHERE uid = ? and deleted_at IS NULL;`,
      values: [uid],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findRunningDialogByTitle(value = null, transaction) {
    if(isEmptyField(value))
      return [];

    const statement = {
      text: `SELECT id, title, message, details, start_time, end_time, status, user_type FROM ${Tables.DIALOG} WHERE title = ? ;`,
      values: [value],
      transaction
    }
    
    const result = await db.query(statement);
    return result.rows
  }


}

module.exports = DialogModel;
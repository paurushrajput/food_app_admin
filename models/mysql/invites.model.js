const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, UnknownUser, Status, InviteStatus } = require("../../constants/database");
const {isEmptyField} = require("../../utils/common");

class InvitesModel {
  static async list(body) {
    const {sort, limit, offset, keyword, is_paginated, from_date, to_date, id, userId} = body;

    // let condition = `WHERE ui.status = ? and ui.deleted_at IS NULL`;
    let condition = `WHERE ui.user_id = ? AND ui.deleted_at IS NULL`;
    const values = [userId];
    const countValues = [userId];

    let pagination = `ORDER BY ui.${sort} limit ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY ui.${sort}`;
    }

    if(!isEmptyField(keyword)){
      condition += ` AND (ui.name LIKE ? OR ui.email LIKE ?)`
      values.push(`%${keyword}%`,`%${keyword}%`);
      countValues.push(`%${keyword}%`,`%${keyword}%`);
    }
    if(!isEmptyField(from_date)){
      condition += ` AND DATE_FORMAT(ui.created_at,'%Y-%m-%d') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }
    if(!isEmptyField(to_date)){
      condition += ` AND DATE_FORMAT(ui.created_at,'%Y-%m-%d') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }
    if(!isEmptyField(id)){
      condition += ` and ui.uid = ?`
      values.push(id);
      countValues.push(id);
    }

    const statement = {
      text: `SELECT 
        ui.uid as id, 
        ui.name,
        ui.phone_number, 
        ui.email, 
        ui.details, 
        IF(ui.status=${InviteStatus.pending}, 0, 1) as is_invited,
        ui.created_at
        FROM ${Tables.USER_INVITES} ui ${condition} ${pagination};`,
      values: values,
      rowsOnly: true,
    }

    const countText = `SELECT count(ui.id) as count FROM ${Tables.USER_INVITES} ui ${condition};`;

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

  static async insert(data) {
      const statement = { ...insertData(Tables.USER_INVITES, data), operation: Operations.INSERT };
      const result = await db.query(statement);
      const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
      return {
          rows: affectedRows,
          msg: `${affectedRows} rows inserted into ${Tables.USER_INVITES} table`
      };
  }

  static async updateOneById(columns, id, transaction = null) {
      const statement = { ...updateSingle(Tables.USER_INVITES, columns, id), operation: Operations.UPDATE, transaction };
      const result = await db.query(statement);
      const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
      return {
          rows: affectedRows,
          msg: `${affectedRows} rows updated into ${Tables.USER_INVITES} table`
      };
  }

  static async updateStatusByIds(status, ids, userId, transaction = null) {
    let condn = `where user_id = ? and status = 1`;
    if(ids && ids.length)
      condn += ` and uid in (${inMapper(ids)})`;  

    const statement = { 
      text: `update ${Tables.USER_INVITES} set status = ? ${condn} ;`, 
      values: [status, userId],
      operation: Operations.UPDATE,
      transaction
    };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
        rows: affectedRows,
        msg: `${affectedRows} rows updated into ${Tables.USER_INVITES} table`
    };
  }

  static async getOneByColumn(body) {
      const {column = 'id', value = ""} = body;

      let text = `SELECT id, uid, status, name, phone_number, email 
        FROM ${Tables.USER_INVITES} 
        WHERE ${column} = ? AND deleted_at IS NULL;`

      const statement = {
        text,
        values: [value],
        rowsOnly: true,
      }

      const result = await db.query(statement);

      return result.rows;
  };

  static async getOneByColumns(body) {
    const {columns = ['id'], values = [""]} = body;
    let columnsString = ``
    columns.map(el=> {
      columnsString += `${el} = ? AND `
    })

    const columnsStringLastIndex = columnsString.trim().lastIndexOf('AND');
    columnsString = columnsString.substr(0, columnsStringLastIndex);

    let text = `SELECT id, uid, name, email, phone_number, details from ${Tables.USER_INVITES} WHERE ${columnsString} AND deleted_at IS NULL;`

    const statement = {
      text,
      values: [...values],
      rowsOnly: true,
    }

    const result = await db.query(statement);

    return result.rows;
  };

  static async getAllByColumnsByInQuery(body, transaction = null) {
    const {columns = ['id'], values = [""]} = body;
    let columnsString = ``
    columns.map((el, index)=> {
      columnsString += `${el} IN (${inMapper(values[index])}) AND `
    })

    const columnsStringLastIndex = columnsString.trim().lastIndexOf('AND');
    columnsString = columnsString.substr(0, columnsStringLastIndex);

    let text = `SELECT id, uid, status, name, email, phone_number, details FROM ${Tables.USER_INVITES} WHERE ${columnsString} AND deleted_at IS NULL;`

    const statement = {
      text,
      values: [...values],
      rowsOnly: true,
      transaction
    }

    const result = await db.query(statement);

    return result.rows;
  };
}

module.exports = InvitesModel;
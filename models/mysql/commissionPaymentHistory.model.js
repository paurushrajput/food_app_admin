const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, UnknownUser, Status } = require("../../constants/database");
const {isEmptyField} = require("../../utils/common");

class CommissionPaymentHistoryModel {
  static async list(body) {
    const {sort, limit, offset, keyword, is_paginated, from_date, to_date, id, type, res_id} = body;

    let condition = `WHERE cph.deleted_at IS NULL`;
    const values = [];
    const countValues = [];

    let pagination = `ORDER BY cph.${sort} LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY cph.${sort}`;
    }

    // if(!isEmptyField(keyword)){
    //   // condition += ` AND (st.title LIKE ? OR st.email LIKE ?)`
    //   // values.push(`%${keyword}%`,`%${keyword}%`);
    //   condition += ` AND (cph.title LIKE ?)`
    //   values.push(`%${keyword}%`);
    //   countValues.push(`%${keyword}%`);
    // }
    if(!isEmptyField(from_date)){
      condition += ` AND DATE_FORMAT(cph.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }
    if(!isEmptyField(to_date)){
      condition += ` AND DATE_FORMAT(cph.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }
    if(!isEmptyField(id)){
      condition += ` and cph.uid = ?`
      values.push(id);
      countValues.push(id);
    }
    if(!isEmptyField(type)){
      condition += ` and cph.payment_mode = ?`
      values.push(type);
      countValues.push(type);
    }
    if(!isEmptyField(res_id)){
      condition += ` and r.uid = ?`
      values.push(res_id);
      countValues.push(res_id);
    }

    const statement = {
      text: `SELECT 
        cph.uid as id, 
        cph.amount,
        cph.from_date, 
        cph.to_date,
        cph.payment_date,
        cph.other_details,
        cph.payment_mode,
        cph.ref_txn_id,
        cph.payment_date,
        cph.status, 
        cph.created_at, 
        cph.deleted_at,
        r.uid as res_id
        FROM ${Tables.COMMISSION_PAYMENT_HISTORY} cph INNER JOIN ${Tables.RESTAURANTS} r ON cph.res_id = r.id ${condition} ${pagination};`,
      values: values,
      rowsOnly: true,
    }

    const countText = `SELECT COUNT(cph.id) as count FROM ${Tables.COMMISSION_PAYMENT_HISTORY} cph INNER JOIN ${Tables.RESTAURANTS} r ON cph.res_id = r.id ${condition};`;

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
      const statement = { ...insertData(Tables.COMMISSION_PAYMENT_HISTORY, data), operation: Operations.INSERT };
      const result = await db.query(statement);
      const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
      return {
          rows: affectedRows,
          msg: `${affectedRows} rows inserted into ${Tables.COMMISSION_PAYMENT_HISTORY} table`
      };
  }

  static async updateOneById(columns, id) {
      const statement = { ...updateSingle(Tables.COMMISSION_PAYMENT_HISTORY, columns, id), operation: Operations.UPDATE };
      const result = await db.query(statement);
      const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
      return {
          rows: affectedRows,
          msg: `${affectedRows} rows updated into ${Tables.COMMISSION_PAYMENT_HISTORY} table`
      };
  }

  static async getOneByColumn(body) {
      const {column = 'id', value = ""} = body;
  
      let text = `SELECT id, uid, status, amount from ${Tables.COMMISSION_PAYMENT_HISTORY} WHERE ${column} = ? AND deleted_at IS NULL;`
  
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

    let text = `SELECT id, uid, status, res_id, amount from ${Tables.COMMISSION_PAYMENT_HISTORY} WHERE ${columnsString} AND deleted_at IS NULL;`

    const statement = {
      text,
      values: [...values],
      rowsOnly: true,
    }

    const result = await db.query(statement);

    return result.rows;
  };
}

module.exports = CommissionPaymentHistoryModel;
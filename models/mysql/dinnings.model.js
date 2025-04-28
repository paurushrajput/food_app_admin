const {
  db,
  inMapper,
  insertData,
  updateSingle,
} = require("../../dbConfig/dbConnect");
const { Tables, Operations, Status } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common.js");

class DinningModel {
  static async updateOneById(columns, id) {
    const statement = {
      ...updateSingle(Tables.DINNINGS, columns, id),
      operation: Operations.UPDATE,
    };
    const result = await db.query(statement);
    const affectedRows = Number(
      JSON.parse(JSON.stringify(result))?.rows?.affectedRows
    );
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.DINNINGS} table`,
    };
  }

  static async listDinnings(body) {
    const {sort, offset, limit, keyword, is_paginated, user, from_date, to_date, dinning_id} = body;

    const values = [];
    const countValues = [];
    let condition = `where 1`;

    let pagination = `ORDER BY d.${sort} LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY d.${sort}`;
    }

    if(!isEmptyField(keyword)){
      condition += ` AND (d.name LIKE ?)`
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
    if(!isEmptyField(dinning_id)){
      condition += ` and d.uid = ?`
      values.push(dinning_id);
      countValues.push(dinning_id);
    }

    const statement = {
        text: `select d.uid as id, d.name as name, d.status as status from ${Tables.DINNINGS} d ${condition} ${pagination};`,
        values: values,
        rowsOnly: true,
    }

    const countText = `select Count(d.id) as count from ${Tables.DINNINGS} d ${condition};`;

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

  static async insert(categories) {
    const statement = {
      ...insertData(Tables.DINNINGS, categories),
      operation: Operations.INSERT,
    };
    const result = await db.query(statement);
    const affectedRows = Number(
      JSON.parse(JSON.stringify(result))?.rows?.affectedRows
    );
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.DINNINGS} table`,
    };
  }

  static async getDinningsByColumn(body) {
    const { column = "id", value = [] } = body;

    const valueArr = value.map(el=>`'${el}'`) || [];

    let text = `SELECT id, uid from ${Tables.DINNINGS} Where ${column} IN (${valueArr});`;

    const statement = {
      text,
      values: [],
      rowsOnly: true,
    };

    const result = await db.query(statement);

    return result.rows;
  }
}
module.exports = DinningModel;

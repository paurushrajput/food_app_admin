const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations } = require("../../constants/database");

class WinnerBreakupModel {

  static async insert(winnerBreakUp) {
    const statement = { ...insertData(Tables.WINNER_BREAKUP, winnerBreakUp), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.WINNER_BREAKUP} table`
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.WINNER_BREAKUP, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.WINNER_BREAKUP} table`
    };
  }

  static async findOneByuId(uid) {
    const statement = {
      text: `SELECT id, name, uid, break_up, status FROM ${Tables.WINNER_BREAKUP} where uid = ? and deleted_at is null ;`,
      values: [uid],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findOneById(id) {
    const statement = {
      text: `SELECT id, name, uid, break_up, status FROM ${Tables.WINNER_BREAKUP} where id = ? and deleted_at is null;`,
      values: [id],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findOneByName(name) {
    const statement = {
      text: `SELECT id, name, uid, break_up, status FROM ${Tables.WINNER_BREAKUP} where LOWER(name) = LOWER(?) and deleted_at is null;`,
      values: [name],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async listWinnerBreakup(body) {
    const { sort, offset, limit, is_paginated, name } = body;
    const columns = `uid as id, name, break_up `
    let condition = ` deleted_at is NULL `;

    const values = [];
    const countValues = [];

    let pagination = `ORDER BY ${sort} LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY ${sort}`;
    }

    if (name && name !== "") {
      condition += ` AND LOWER(name) LIKE LOWER (?)`
      values.push(`%${name}%`);
      countValues.push(`%${name}%`);
    }


    const text = `SELECT ${columns} FROM ${Tables.WINNER_BREAKUP} WHERE ${condition} ${pagination}`;
    const countText = `SELECT Count(id) as count from ${Tables.WINNER_BREAKUP} WHERE ${condition}`;

    const statement = {
      text,
      values,
      rowsOnly: true
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
      count: promiseData[1]?.rows[0]?.count,
      rows: promiseData[0]?.rows,
    }
  }

}

module.exports = WinnerBreakupModel;
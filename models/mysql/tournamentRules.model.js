const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations } = require("../../constants/database");

class TournamentRulesModel {

  static async insert(tournamentManifest) {
    const statement = { ...insertData(Tables.TOURNAMENT_RULES, tournamentManifest), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.TOURNAMENT_RULES} table`
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.TOURNAMENT_RULES, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.TOURNAMENT_RULES} table`
    };
  }

  static async findOneByuId(uid) {
    const statement = {
      text: `SELECT id, uid, name, rule, status FROM ${Tables.TOURNAMENT_RULES} where uid = ? and deleted_at is null ;`,
      values: [uid],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findOneById(uid) {
    const statement = {
      text: `SELECT id, uid, name, rule, status FROM ${Tables.TOURNAMENT_RULES} where id = ? and deleted_at is null ;`,
      values: [uid],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findOneByName(name) {
    const statement = {
      text: `SELECT id, uid, name, rule, status FROM ${Tables.TOURNAMENT_RULES} where LOWER(name) = LOWER(?) and deleted_at is null ;`,
      values: [name],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async listTournamentRuleList(body) {
    const { sort, offset, limit, is_paginated, name } = body;
    const columns = ` uid as id, name, rule `
    let condition = ` deleted_at is NULL `;

    const values = [];
    const countValues = [];

    let pagination = `ORDER BY ${sort} LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY ${sort}`;
    }

    if (name && name !== "") {
      condition += ` AND (LOWER(name) like LOWER(?))`
      values.push(`%${name}%`);
      countValues.push(`%${name}%`);
    }

    const text = `SELECT ${columns} FROM ${Tables.TOURNAMENT_RULES} WHERE ${condition} ${pagination}`;
    const countText = `SELECT Count(id) as count from ${Tables.TOURNAMENT_RULES} WHERE ${condition}`;

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

module.exports = TournamentRulesModel;
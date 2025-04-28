const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Status, Bit } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");

class ModulesModel {

  static async insert(data) {
    const statement = { ...insertData(Tables.MODULES, data), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.MODULES} table`
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.MODULES, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.MODULES} table`
    };
  }

  static async findOneByuId(uid, transaction) {
    const statement = {
      text: `SELECT id, uid, name, status FROM ${Tables.MODULES} WHERE uid = ? and deleted_at IS NULL;`,
      values: [uid],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findOneById(id) {
    const statement = {
      text: `SELECT id, uid, name, status FROM ${Tables.MODULES} where id = ? and deleted_at is null ;`,
      values: [id],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async list(body) {
    const { sort, limit, offset, is_paginated, keyword } = body;

    let condition = `WHERE status = ${Status.one} and deleted_at IS NULL`;
    const values = [];
    const countValues = [];

    let pagination = `ORDER BY ${sort} LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY ${sort}`;
    }

    if (!isEmptyField(keyword)) {
      condition += ` AND (name LIKE ? )`
      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }

    const text = `SELECT uid AS id, name, status, created_at FROM ${Tables.MODULES} ${condition} ${pagination};`
    const countText = `SELECT COUNT(id) as count FROM ${Tables.MODULES} ${condition}`;

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

  static async checkIfModuleExist(name) {
    const statement = {
      text: `SELECT id, uid, name, status FROM 
        ${Tables.MODULES} 
        WHERE LOWER(name) = ? ;`,
      values: [name],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async hardDelete(id, transaction) {
    const statement = {
      text: `DELETE FROM ${Tables.MODULES} WHERE id = ? ;`,
      values: [id],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async getAllModuleNames() {
    const statement = {
      text: `SELECT name FROM ${Tables.MODULES} ;`,
      values: [],
    }
    const result = await db.query(statement);
    return result.rows
  }
}

module.exports = ModulesModel;
const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Status, Bit } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");

class PermissionModel {

  static async insert(data) {
    const statement = { ...insertData(Tables.PERMISSIONS, data), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.PERMISSIONS} table`
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.PERMISSIONS, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.PERMISSIONS} table`
    };
  }

  static async findOneByuId(uid, transaction) {
    const statement = {
      text: `SELECT id, uid, module_id, type, status FROM ${Tables.PERMISSIONS} WHERE uid = ? ;`,
      values: [uid],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findOneById(id) {
    const statement = {
      text: `SELECT id, uid, module_id, type, status FROM ${Tables.PERMISSIONS} where id = ?  ;`,
      values: [id],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async list(body) {
    const { sort, limit, offset, is_paginated, type, keyword } = body;

    let condition = `WHERE p.status = ${Status.one} `;
    const values = [];
    const countValues = [];

    let pagination = `ORDER BY p.${sort} LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY p.${sort}`;
    }

    if (!isEmptyField(type)) {
      condition += ` AND (p.type LIKE ?)`
      values.push(`%${type}%`);
      countValues.push(`%${type}%`);
    }

    if (!isEmptyField(keyword)) {
      condition += ` AND (m.name LIKE ?)`
      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }
    
    const text = `SELECT 
        p.uid AS id, m.uid AS module_id, p.type, p.status, p.created_at, m.name as module_name 
      FROM ${Tables.PERMISSIONS} p
      INNER JOIN ${Tables.MODULES} m ON p.module_id = m.id
      ${condition} ${pagination};`
    const countText = `SELECT COUNT(p.id) as count 
      FROM ${Tables.PERMISSIONS} p
      INNER JOIN ${Tables.MODULES} m ON p.module_id = m.id
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

  static async checkIfPermissionExist(moduleId, type) {
    const statement = {
      text: `SELECT id, uid, module_id, type, status FROM 
        ${Tables.PERMISSIONS} 
        WHERE module_id = ? AND type = ? ;`,
      values: [moduleId, type],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async hardDelete(id, transaction) {
    const statement = {
      text: `DELETE FROM ${Tables.PERMISSIONS} WHERE id = ? ;`,
      values: [id],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }
}

module.exports = PermissionModel;
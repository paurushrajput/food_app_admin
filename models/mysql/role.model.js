const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Status, Bit } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");
const { SUPER_ADMIN_ROLE } = require("../../constants/roles");

class RoleModel {

  static async insert(data) {
    const statement = { ...insertData(Tables.ROLES, data), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.ROLES} table`
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.ROLES, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.ROLES} table`
    };
  }

  static async findOneByuId(uid, transaction) {
    const statement = {
      text: `SELECT id, uid, name, role_key, status FROM ${Tables.ROLES} WHERE uid = ? and deleted_at IS NULL;`,
      values: [uid],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findOneById(id, transaction) {
    const statement = {
      text: `SELECT id, uid, name, role_key, status FROM ${Tables.ROLES} where id = ? and deleted_at is null ;`,
      values: [id],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async list(body) {
    const { sort, limit, offset, is_paginated, keyword } = body;

    let condition = `WHERE status = ${Status.one} and deleted_at IS NULL and role_key <> '${SUPER_ADMIN_ROLE}'`;
    const values = [];
    const countValues = [];

    let pagination = `ORDER BY ${sort} LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY ${sort}`;
    }

    if (!isEmptyField(keyword)) {
      condition += ` AND (name LIKE ? OR role_key LIKE ? )`
      values.push(`%${keyword}%`,`%${keyword}%`);
      countValues.push(`%${keyword}%`,`%${keyword}%`);
    }
    
    const text = `SELECT uid AS id, name, role_key, status, created_at FROM ${Tables.ROLES} ${condition} ${pagination};`
    const countText = `SELECT COUNT(id) as count FROM ${Tables.ROLES} ${condition}`;

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

  static async checkIfRoleExist(name) {
    const statement = {
      text: `SELECT id, uid, name, status FROM 
        ${Tables.ROLES} 
        WHERE LOWER(name) = ? AND deleted_at IS NULL;`,
      values: [name],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async hardDelete(id, transaction) {
    const statement = {
      text: `DELETE FROM ${Tables.ROLES} WHERE id = ? ;`,
      values: [id],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }
}

module.exports = RoleModel;
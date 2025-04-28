const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Status, Bit } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");

class RolePermissionModel {

  static async insert(data, transaction) {
    const statement = { ...insertData(Tables.ROLE_PERMISSION, data), operation: Operations.INSERT, transaction };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.ROLE_PERMISSION} table`
    };
  }

  static async updateOneById(columns, id, transaction) {
    const statement = { ...updateSingle(Tables.ROLE_PERMISSION, columns, id), operation: Operations.UPDATE, transaction };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.ROLE_PERMISSION} table`
    };
  }

  static async findOneByuId(uid, transaction) {
    const statement = {
      text: `SELECT id, uid, permission_id, role_id, status FROM ${Tables.ROLE_PERMISSION} WHERE uid = ? and deleted_at IS NULL;`,
      values: [uid],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findOneById(id) {
    const statement = {
      text: `SELECT id, uid, permission_id, role_id, status FROM ${Tables.ROLE_PERMISSION} where id = ? and deleted_at is null ;`,
      values: [id],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async list(body) {
    const { sort, limit, offset, is_paginated, keyword } = body;

    let condition = `WHERE rp.status = ${Status.one} and rp.deleted_at IS NULL`;
    const values = [];
    const countValues = [];

    let pagination = `ORDER BY ${sort} LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY ${sort}`;
    }

    if (!isEmptyField(keyword)) {
      condition += ` AND (r.name LIKE ? OR m.name LIKE ? )`
      values.push(`%${keyword}%`,`%${keyword}%`);
      countValues.push(`%${keyword}%`,`%${keyword}%`);
    }
    
    const text = `SELECT 
      rp.uid as id, m.uid AS module_id, COALESCE (rp.updated_at, rp.created_at) as created_at, r.uid AS role_id, p.type as permission_type, rp.status, r.name as role_name, p.uid as permission_id, m.name as module_name 
      FROM ${Tables.ROLE_PERMISSION} rp 
      JOIN ${Tables.ROLES} r on rp.role_id = r.id
      JOIN ${Tables.PERMISSIONS} p on rp.permission_id = p.id
      JOIN ${Tables.MODULES} m on p.module_id = m.id
    ${condition} ${pagination};`

    const countText = `SELECT COUNT(rp.id) as count 
    FROM ${Tables.ROLE_PERMISSION} rp JOIN ${Tables.ROLES} r on rp.role_id = r.id
      JOIN ${Tables.PERMISSIONS} p on rp.permission_id = p.id
      JOIN ${Tables.MODULES} m on p.module_id = m.id ${condition}`;

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

  static async checkIfRolePermissionExist(permissionId, roleId, transaction) {
    const statement = {
      text: `SELECT id, uid, permission_id, role_id, status FROM 
        ${Tables.ROLE_PERMISSION} 
        WHERE permission_id = ? AND role_id = ? AND deleted_at IS NULL;`,
      values: [permissionId, roleId],
      transaction,
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async hardDelete(id, transaction) {
    const statement = {
      text: `DELETE FROM ${Tables.ROLE_PERMISSION} WHERE id = ? ;`,
      values: [id],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }
}

module.exports = RolePermissionModel;
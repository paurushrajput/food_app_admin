const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Status, Bit } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");

class UserRoleModel {

  static async insert(data, transaction) {
    const statement = { ...insertData(Tables.USER_ROLES, data), operation: Operations.INSERT, transaction };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.USER_ROLES} table`
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.USER_ROLES, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.USER_ROLES} table`
    };
  }

  static async findOneByuId(uid, transaction) {
    const statement = {
      text: `SELECT id, uid, user_id, role_id, status FROM ${Tables.USER_ROLES} WHERE uid = ? and deleted_at IS NULL;`,
      values: [uid],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findOneById(id) {
    const statement = {
      text: `SELECT id, uid, user_id, role_id, status FROM ${Tables.USER_ROLES} where id = ? and deleted_at is null ;`,
      values: [id],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findRoleDetailsByUserId(user_id) {
    const statement = {
      text: `SELECT r.uid as role_id, r.name, r.role_key FROM ${Tables.USER_ROLES} ur join ${Tables.ROLES} r ON ur.role_id = r.id 
      where user_id = ? and ur.deleted_at is null;`,
      values: [user_id],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async list(body) {
    const { sort, limit, offset, is_paginated, keyword } = body;

    let condition = `WHERE ur.status = ${Status.one} and ur.deleted_at IS NULL`;
    const values = [];
    const countValues = [];

    let pagination = `ORDER BY ur.${sort} LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY ur.${sort}`;
    }

    if (!isEmptyField(keyword)) {
      condition += ` AND (JSON_EXTRACT(a.contact_info, '$.name') LIKE ? OR r.name LIKE ? OR JSON_EXTRACT(a.contact_info, '$.email') LIKE ?)`
      values.push(`%${keyword}%`,`%${keyword}%`,`%${keyword}%`);
      countValues.push(`%${keyword}%`,`%${keyword}%`,`%${keyword}%`);
    }
    
    const text = `SELECT 
      ur.uid as id, 
      a.id AS user_id, 
      r.uid AS role_id, 
      r.name as role_name,
      a.contact_info
    FROM 
    ${Tables.USER_ROLES} ur 
    JOIN ${Tables.ROLES} r on ur.role_id = r.id
    JOIN ${Tables.ADMIN} a on ur.user_id = a.id
    ${condition} ${pagination};`

    const countText = `SELECT COUNT(ur.id) as count FROM ${Tables.USER_ROLES} ur 
    JOIN ${Tables.ROLES} r on ur.role_id = r.id
    JOIN ${Tables.ADMIN} a on ur.user_id = a.id ${condition}`;

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

  static async checkIfUserRoleExist(userId, roleId, transaction) {
    const statement = {
      text: `SELECT id, uid, user_id, role_id, status FROM 
        ${Tables.USER_ROLES} 
        WHERE user_id = ? AND role_id = ? AND deleted_at IS NULL;`,
      values: [userId, roleId],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async getRolePermissionByRoleKey(roleKey, transaction) {
    const statement = {
      text: `select r.name, r.role_key, JSON_ARRAYAGG(JSON_OBJECT('type', p.type, 'module_name', m.name)) as permissions
      from ${Tables.ROLES} r 
      join ${Tables.ROLE_PERMISSION} rp on r.id = rp.role_id 
      join ${Tables.PERMISSIONS} p on rp.permission_id = p.id 
      join ${Tables.MODULES} m on p.module_id = m.id
      where r.role_key = ? group by name, role_key;`,
      values: [roleKey],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async hardDelete(id, transaction) {
    const statement = {
      text: `DELETE FROM ${Tables.USER_ROLES} WHERE id = ? ;`,
      values: [id],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }
}

module.exports = UserRoleModel;
const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");

class AdminAuthModel {

  static async insert(logindetails, transaction) {
    const statement = { ...insertData(Tables.ADMIN, logindetails), operation: Operations.INSERT, transaction };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.ADMIN} table`
    }
  }

  static async getAdminById(id, transaction) {
    const statement = {
      text: `SELECT * FROM ${Tables.ADMIN} where id = ? ;`,
      values: [id],
      transaction
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async updateOneById(columns, id, transaction) {
    const statement = { ...updateSingle(Tables.ADMIN, columns, id), operation: Operations.UPDATE, transaction };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.ADMIN} table`
    };
  }

  static async getAdminByEmail(email, transaction) {
    const statement = {
      text: `SELECT * FROM ${Tables.ADMIN} WHERE LOWER(email) = LOWER(?) ;`,
      values: [email],
      transaction
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async list(body) {
    const { sort, limit, offset, keyword, is_paginated, from_date, to_date, id, type, status } = body;

    let condition = `WHERE st.deleted_at IS NULL`;
    const values = [];
    const countValues = [];

    // let pagination = `ORDER BY st.${sort} LIMIT ${offset}, ${limit}`;
    let pagination = `ORDER BY st.sequence asc LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY st.sequence asc`;
    }

    if (!isEmptyField(keyword)) {
      condition += ` AND (st.title LIKE ?)`
      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }
    if (!isEmptyField(from_date)) {
      condition += ` AND DATE_FORMAT(st.created_at,'%Y-%m-%d') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }
    if (!isEmptyField(to_date)) {
      condition += ` AND DATE_FORMAT(st.created_at,'%Y-%m-%d') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }
    if (!isEmptyField(id)) {
      condition += ` and st.uid = ?`
      values.push(id);
      countValues.push(id);
    }
    if (!isEmptyField(type)) {
      condition += ` and st.type = ?`
      values.push(type);
      countValues.push(type);
    }
    if (!isEmptyField(status)) {
      condition += ` AND (st.status = ?)`
      values.push(status);
      countValues.push(status);
    }

    const statement = {
      text: `SELECT 
            st.uid as id, 
            st.title,
            st.duration, 
            st.type,
            st.action,
            st.status, 
            st.created_at, 
            st.deleted_at,
            st.sequence,
            COALESCE(CONCAT(m.basePath,'/',m.filename),'') as image
            FROM ${Tables.ADMIN} st left join ${Tables.MEDIA} m on st.image_id = m.id ${condition} ${pagination};`,
      values: values,
      rowsOnly: true,
    }

    const countText = `SELECT count(st.id) as count FROM ${Tables.STORIES} st ${condition};`;

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
  }

  static async getAdminDetailsId(id, transaction) {
    const statement = {
      text: `SELECT a.id, a.email, a.token, r.role_key FROM ${Tables.ADMIN} a 
      join ${Tables.USER_ROLES} ur on a.id = ur.user_id
      join ${Tables.ROLES} r on ur.role_id = r.id
      where a.id = ? ;`,
      values: [id],
      transaction
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async subAdminList(body) {
    const { sort, limit, offset, keyword, is_paginated } = body;

    let condition = `WHERE a.deleted_at IS NULL `;
    const values = [];
    const countValues = [];

    let pagination = `ORDER BY a.created_at asc LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY a.created_at asc`;
    }

    if (!isEmptyField(keyword)) {
      condition += ` AND (u.email LIKE ?) OR (r.name LIKE ?)`
      values.push(`%${keyword}%`, `%${keyword}%`);
      countValues.push(`%${keyword}%`, `%${keyword}%`);
    }

    const statement = {
      text: `SELECT 
            a.id, 
            a.email,
            a.contact_info, 
            JSON_ARRAYAGG(r.name) as role
            FROM ${Tables.ADMIN} a 
            left join ${Tables.USER_ROLES} ur on ur.user_id = a.id
            left join ${Tables.ROLES} r on ur.role_id = r.id
            ${condition} group by a.id ${pagination};`,
      values: values,
      rowsOnly: true,
    }

    const countText = `SELECT count(a.id) as count FROM ${Tables.ADMIN} a 
            left join ${Tables.USER_ROLES} ur on ur.user_id = a.id
            left join ${Tables.ROLES} r on ur.role_id = r.id ${condition};`;

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
  }

  static async getAdminRoleAndDataByEmail(email, transaction){
    const statement = {
      text: `SELECT a.id, a.password, JSON_ARRAYAGG(r.role_key) roles  FROM ${Tables.ADMIN} a 
      join ${Tables.USER_ROLES} ur on a.id = ur.user_id
      join ${Tables.ROLES} r on ur.role_id = r.id
      where a.email = ? group by a.id; ;`,
      values: [email],
      transaction
    }
    const result = await db.query(statement);
    return result.rows;
  }
}
module.exports = AdminAuthModel;
const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Bit } = require("../../constants/database");
const { getUrlFromBucket } = require("../../utils/s3");
const MediaModel = require("./media.model");
const { isEmptyField } = require("../../utils/common.js");

class CategoryModel {
  static async updateOneById(columns, id,transaction) {
    const statement = { ...updateSingle(Tables.CATEGORIES, columns, id), operation: Operations.UPDATE,transaction };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.CATEGORIES} table`
    };
  }
  static async getOneByuId(uid, transaction) {
    const statement = {
      text: `SELECT * FROM ${Tables.CATEGORIES} where uid = ?;`,
      values: [uid],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }
  static async listCategories(body) {
    const { sort, offset, limit, is_paginated, keyword, from_date, to_date, name, type, status } = body;
    const columns = `cat.*, CONCAT(m.basePath,'/',m.filename) as icon`
    let condition = `WHERE 1`;
    const values = [];
    const countValues = [];

    let pagination = `ORDER BY ${sort} LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY ${sort}`;
    }

    if (!isEmptyField(keyword)) {
      condition += ` AND (cat.name LIKE ?)`
      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }
    if (!isEmptyField(from_date)) {
      condition += ` AND DATE_FORMAT(cat.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }
    if (!isEmptyField(to_date)) {
      condition += ` AND DATE_FORMAT(cat.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }
    if (!isEmptyField(name)) {
      condition += ` AND cat.name LIKE ?`
      values.push(`%${name}%`);
      countValues.push(`%${name}%`);
    }
    if (!isEmptyField(type)) {
      condition += ` AND cat.type LIKE ?`
      values.push(`%${type}%`);
      countValues.push(`%${type}%`);
    }
    if (!isEmptyField(status)) {
      condition += ` AND (cat.status = ?)`
      values.push(status);
      countValues.push(status);
    }

    const text = `SELECT ${columns}, (
          SELECT COUNT(res_cat.id) FROM ${Tables.RESTAURANT_CATEGORIES} res_cat
          INNER JOIN ${Tables.RESTAURANTS} r on res_cat.res_id = r.id
          WHERE res_cat.cat_id = cat.id AND r.status = ${Bit.one} AND r.is_pilot = ${Bit.zero}
        ) as restaurant_count
        FROM ${Tables.CATEGORIES} cat 
        LEFT JOIN ${Tables.MEDIA} m on cat.icon = m.id 
        ${condition} ${pagination}`;

    const countText = `SELECT COUNT(cat.id) as count FROM ${Tables.CATEGORIES} cat ${condition}`;

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

  static async insert(categories) {
    const statement = { ...insertData(Tables.CATEGORIES, categories), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.CATEGORIES} table`
    };
  }

  static async getFileNameByCategoryId(uid) {
    const statement = {
      text: `SELECT c.uid as category_uid , c.id as category_id, m.id as media_id, m.filename from ${Tables.CATEGORIES} as c left join ${Tables.MEDIA} as m on c.icon = m.id where c.uid = ?;`,
      values: [uid]
    }
    const result = await db.query(statement);
    return result.rows[0];
  }

  static async deleteRestaurantCategories(id) {
    const statement = {
      text: `DELETE FROM ${Tables.RESTAURANT_CATEGORIES} where cat_id = ? ;`,
      values: [id],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async isCategoryExistWithSameName(name) {
    let text = `SELECT id, uid, name FROM ${Tables.CATEGORIES} WHERE LOWER(name) LIKE LOWER (?);`

    const statement = {
      text,
      values: [name],
      rowsOnly: true,
    }
    const result = await db.query(statement);
    return result.rows;
  };

  static async getCategoriesByUID(uids, transaction) {
    const statement = {
      text: `SELECT id,uid,name,type,status FROM ${Tables.CATEGORIES} where uid IN (${inMapper(uids)}) AND type = 'deal';`,
      values: [],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

}
module.exports = CategoryModel;
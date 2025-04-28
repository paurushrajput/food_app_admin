const { db, inMapper, insertData, insertFileData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Bit, Status } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");


class MediaModel {
  static async insert(media) {
    const statement = { ...insertData(Tables.MEDIA, media), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.MEDIA} table`
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.MEDIA, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.MEDIA} table`
    };
  }

  static async getOneById(id) {
    const statement = {
      text: `SELECT * FROM ${Tables.MEDIA} where id = ?;`,
      values: [id],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async getOneByUId(id) {
    const statement = {
      text: `SELECT id, uid, basePath, filename FROM ${Tables.MEDIA} where uid = ?;`,
      values: [id],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async getAllByIds(ids) {
    if (!Array.isArray(ids)) {
      ids = [ids]
    }
    const statement = {
      text: `SELECT id, uid, basePath, filename FROM ${Tables.MEDIA} where id in (${inMapper(ids)});`,
      values: [],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async getAllByUIds(ids, transaction) {
    if (!Array.isArray(ids)) {
      ids = [ids]
    }
    const statement = {
      text: `SELECT id, uid, basePath, filename FROM ${Tables.MEDIA} where uid in (${inMapper(ids)});`,
      values: [],
      transaction,
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async deleteById(id) {
    const statement = {
      text: `DELETE FROM ${Tables.MEDIA} where id = ?;`,
      values: [id],
    }
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows deleted from ${Tables.MEDIA} table`
    };

  }

  static async getImageByName(imageName) {
    const statement = {
      text: ` SELECT *, COALESCE(CONCAT(basePath,'/',filename),'') as icon FROM ${Tables.MEDIA} WHERE filename = ?`,
      values: [imageName]
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async getOneByuId(uid) {
    const statement = {
      text: `SELECT * FROM ${Tables.MEDIA} where uid = ?;`,
      values: [uid],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async checkIfIdsExist(uids) {
    if (!Array.isArray(uids)) {
      uids = [uids];
    }
    const statement = {
      text: `SELECT uid, id FROM ${Tables.MEDIA} where uid IN (${inMapper(uids)});`,
      values: [],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async list(body) {
    const { sort, limit, offset, keyword, is_paginated, from_date, to_date, id, type, status, searchBy } = body;

    // let condition = `WHERE st.deleted_at IS NULL`;
    let condition = `WHERE 1`;
    const values = [];
    const countValues = [];

    let pagination = `ORDER BY m.${sort} LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY m.${sort} asc`;
    }
    if (searchBy === 'cuisine') {
      condition += ` AND m.id IN (SELECT DISTINCT icon FROM ${Tables.CATEGORIES} WHERE type = 'cuisine')`;
    } else if (searchBy === 'banner') {
      condition += ` AND m.id IN (SELECT DISTINCT banner_url FROM ${Tables.BANNER})`;

    } else if (searchBy === 'amenities') {
      condition += ` AND m.id IN (SELECT DISTINCT icon FROM ${Tables.AMENITIES})`;

    } else if (searchBy === 'restaurant') {
      condition += ` AND m.id IN  (
        SELECT DISTINCT CAST(json_extract(value, '$') AS UNSIGNED)
        FROM ${Tables.RESTAURANTS}, JSON_TABLE(
            JSON_EXTRACT(image_urls, '$.restaurant_images'),
            '$[*]' COLUMNS(value JSON PATH '$')
        ) AS images
        WHERE JSON_LENGTH(image_urls->'$.restaurant_images') > 0
    )`;

    } else if (searchBy === 'location') {
      condition += ` AND m.id IN (SELECT DISTINCT icon FROM ${Tables.LOCATION})`;

    } else if (searchBy === 'deals') {
      condition += `
          AND (
              EXISTS (SELECT DISTINCT 1 FROM ${Tables.DEALS} d WHERE d.home_image = m.id)
              OR EXISTS (
                  SELECT 1 
                  FROM ${Tables.DEALS} d
                  WHERE JSON_CONTAINS(JSON_EXTRACT(d.images, '$[*]'), CAST(m.id AS CHAR))
              )
          )
      `;
  }
    else if (searchBy === 'restaurant_menu') {
      condition += ` AND m.id IN  (
        SELECT DISTINCT CAST(json_extract(value, '$') AS UNSIGNED)
        FROM ${Tables.RESTAURANTS}, JSON_TABLE(
            JSON_EXTRACT(image_urls, '$.menu_images'),
            '$[*]' COLUMNS(value JSON PATH '$')
        ) AS images
        WHERE JSON_LENGTH(image_urls->'$.menu_images') > 0
    )`;

    }

    if (!isEmptyField(keyword)) {
      // condition += ` AND (st.title LIKE ? OR st.email LIKE ?)`
      // values.push(`%${keyword}%`,`%${keyword}%`);
      condition += ` AND (m.filename LIKE ?)`
      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }
    if (!isEmptyField(from_date)) {
      condition += ` AND DATE_FORMAT(m.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }
    if (!isEmptyField(to_date)) {
      condition += ` AND DATE_FORMAT(m.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }
    if (!isEmptyField(id)) {
      condition += ` and m.uid = ?`
      values.push(id);
      countValues.push(id);
    }
    if (!isEmptyField(status)) {
      condition += ` AND (m.status = ?)`
      values.push(status);
      countValues.push(status);
    }
    if (!isEmptyField(type)) {
      condition += ` AND m.type = ?`;
      values.push(type);
      countValues.push(type);
    }
    const statement = {
      text: `SELECT 
            m.uid as id, 
            m.basePath,
            m.filename, 
            m.created_at,
            COALESCE(CONCAT(m.basePath,'/',m.filename),'') as image_url
            FROM ${Tables.MEDIA} m ${condition} ${pagination};`,
      values: values,
      rowsOnly: true,
    }

    const countText = `SELECT count(m.id) as count FROM ${Tables.MEDIA} m ${condition};`;

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

  static async getImageByUid(uid) {
    const statement = {
      text: ` SELECT  id,uid,COALESCE(CONCAT(basePath,'/',filename),'') as icon FROM ${Tables.MEDIA} WHERE uid = ?`,
      values: [uid]
    }
    const result = await db.query(statement);
    return result.rows
  }
}

module.exports = MediaModel;
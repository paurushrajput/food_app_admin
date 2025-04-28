const {
  db,
  inMapper,
  insertData,
  updateSingle,
} = require("../../dbConfig/dbConnect");
const { Tables, Operations, Status, Bit } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common.js");

class AmenitiesModel {
  static async updateOneById(columns, id) {
    const statement = {
      ...updateSingle(Tables.AMENITIES, columns, id),
      operation: Operations.UPDATE,
    };
    const result = await db.query(statement);
    const affectedRows = Number(
      JSON.parse(JSON.stringify(result))?.rows?.affectedRows
    );
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.AMENITIES} table`,
    };
  }

  static async listAmenities(body) {
    const { sort, offset, limit, keyword, is_paginated, user, from_date, to_date, amenities_id, status } = body;

    const values = [];
    const countValues = [];
    let condition = `where 1`;


    let pagination = `ORDER BY a.${sort} LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY a.${sort}`;
    }

    if (!isEmptyField(keyword)) {
      condition += ` AND (a.name LIKE ?)`
      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }
    if (!isEmptyField(from_date)) {
      condition += ` AND DATE_FORMAT(a.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }
    if (!isEmptyField(to_date)) {
      condition += ` AND DATE_FORMAT(a.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }
    if (!isEmptyField(amenities_id)) {
      condition += ` AND a.uid = ?`
      values.push(amenities_id);
      countValues.push(amenities_id);
    }
    if (!isEmptyField(status)) {
      condition += ` AND (a.status = ?)`
      values.push(status);
      countValues.push(status);
    }

    const statement = {
      text: `select a.uid as id, a.name as name, a.status as status, (select count(res_am.id) from ${Tables.RESTAURANT_AMENITIES} res_am INNER JOIN ${Tables.RESTAURANTS} r on res_am.res_id = r.id where res_am.amen_id = a.id AND r.status = ${Bit.one} AND r.is_pilot = ${Bit.zero}) as restaurant_count ,COALESCE(CONCAT(m.basePath,'/',m.filename),'') as icon from ${Tables.AMENITIES} a
        left join ${Tables.MEDIA} m on a.icon = m.id ${condition} ${pagination};`,
      values: values,
      rowsOnly: true,
    }

    const countText = `select Count(a.id) as count from ${Tables.AMENITIES} a ${condition};`;

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
    const statement = {
      ...insertData(Tables.AMENITIES, categories),
      operation: Operations.INSERT,
    };
    const result = await db.query(statement);
    const affectedRows = Number(
      JSON.parse(JSON.stringify(result))?.rows?.affectedRows
    );
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.AMENITIES} table`,
    };
  }

  static async getAmenitiesByColumn(body) {
    const { column = "id", value = [] } = body;

    const valueArr = value.map(el => `'${el}'`) || [];

    let text = `SELECT id, uid from ${Tables.AMENITIES} Where ${column} IN (${valueArr});`;

    const statement = {
      text,
      values: [],
      rowsOnly: true,
    };

    const result = await db.query(statement);

    return result.rows;
  }

  static async deleteRestaurantAmenities(id) {
    const statement = {
      text: `DELETE FROM ${Tables.RESTAURANT_AMENITIES} where amen_id = ? ;`,
      values: [id],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async isAminityExistWithSameName(name) {
    let text = `SELECT id, uid, name FROM ${Tables.AMENITIES} WHERE LOWER(name) LIKE LOWER (?);`

    const statement = {
      text,
      values: [name],
      rowsOnly: true,
    }
    const result = await db.query(statement);
    return result.rows;
  };
}
module.exports = AmenitiesModel;

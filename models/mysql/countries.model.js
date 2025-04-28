const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Bit, Status } = require("../../constants/database");
const {isEmptyField} = require("../../utils/common");

class CountriesModel {
  static async listCountries(body) {
    const { sort, offset, limit, is_paginated, keyword, from_date, to_date, country_id } = body;
    let condition = `status = ? AND operational = ?`;
    let pagination = `order by ${sort} limit ${offset}, ${limit}`;
    const values = [Status.one, Bit.one];
    const countValues = [Status.one, Bit.one];

    if(!is_paginated){
      pagination = ``;
    }

    if(!isEmptyField(keyword)){
      condition += ` AND (name LIKE ?)`
      // condition += ` AND (l.name LIKE ? OR l.email LIKE ? OR l.phone LIKE ?)`
      // values.push(`%${keyword}%`,`%${keyword}%`,`%${keyword}%`);
      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }
    if(!isEmptyField(from_date)){
      condition += ` and DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }
    if(!isEmptyField(to_date)){
      condition += ` and DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }
    if (!isEmptyField(country_id)) {
      condition += ` AND id = ?`;
      values.push(`${country_id}`);
      countValues.push(`${country_id}`);
    }
  

    const statement = {
      text: `SELECT id, uid, name, dial_code, code, shortCode, phone_length, flag, CAST(operational AS SIGNED) as operational, status, created_at from ${Tables.COUNTRIES} WHERE ${condition} ${pagination};`,
      values,
      rowsOnly: true,
    }

    const countText = `SELECT COUNT(id) AS count FROM ${Tables.COUNTRIES} WHERE ${condition}`;
    const countStatement = {
      text: countText,
      values: countValues,
      rowsOnly: true,
    };
  
    const listPr = db.query(statement);
    const countPr = db.query(countStatement);
    const [list, count] = await Promise.all([listPr, countPr]);
  
    return {
      count: count?.rows[0]?.count || 0,
      rows: list?.rows || [],
    };
  };

  static async getCountryByColumn(body) {
    const {column = 'id', value = ""} = body;

    let text = `SELECT * from countries Where ${column} = ?;`

    const statement = {
      text,
      values: [value],
      rowsOnly: true,
    }

    const result = await db.query(statement);

    return result.rows;
  };

  static async insert(countries) {
    const statement = { ...insertData(Tables.COUNTRIES, countries), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
        rows: affectedRows,
        msg: `${affectedRows} rows inserted into ${Tables.COUNTRIES} table`
    };
  }

  static async listAllCountries(){
    const statement = {
      text: `SELECT * from ${Tables.COUNTRIES} WHERE status = ?;`,
      values: [Bit.one],
      rowsOnly: true,
    }
    const result = await db.query(statement);

    return result.rows;
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.COUNTRIES, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
        rows: affectedRows,
        msg: `${affectedRows} rows updated into ${Tables.COUNTRIES} table`
    };
  }
}

module.exports = CountriesModel;
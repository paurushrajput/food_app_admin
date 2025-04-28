const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Bit, Status } = require("../../constants/database");
const {isEmptyField} = require("../../utils/common");

class CitiesModel {
  static async insert(cities) {
    const statement = { ...insertData(Tables.CITIES, cities), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
        rows: affectedRows,
        msg: `${affectedRows} rows inserted into ${Tables.CITIES} table`
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.CITIES, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
        rows: affectedRows,
        msg: `${affectedRows} rows updated into ${Tables.CITIES} table`
    };
  }

  static async listCities(body) {
    const {country_id, sort,  offset, limit, keyword, is_paginated} = body;

    const columns = `uid, name`
    let condition = `where country_id = ? AND status = 1`;
    let pagination = `order by ${sort} limit ${offset}, ${limit}`;
    
    const values = [country_id];
    const countValues = [country_id];

    if(!is_paginated || is_paginated === "" || is_paginated.toString() === 'false'){
      pagination = ``;
    }

    if(keyword && keyword !== ""){
      condition += ` AND name LIKE ?`
      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }

    const text = `SELECT ${columns} from cities ${condition} ${pagination};`
    const countText = `SELECT Count(id) as count from cities ${condition}`;
    
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
      count: promiseData[1]?.rows[0]?.count,
      rows: promiseData[0]?.rows,
    }
  };

  static async getCityByNameAndCountry(body) {
    const {name = '', country_id = ''} = body;

    const statement = {
      text: `SELECT * from cities Where name = ? And country_id = ?;`,
      values: [name, country_id],
      rowsOnly: true,
    }

    const result = await db.query(statement);

    return result.rows;
  };

  static async getCitiesByCountryId(body) {
    const { sort, offset, limit, is_paginated, keyword, from_date, to_date, city_id, country_id } = body;
    let condition = `city.status = ? AND city.operational = ?`;
    let pagination = `order by city.${sort} limit ${offset}, ${limit}`;
    const values = [Status.one, Bit.one];
    const countValues = [Status.one, Bit.one];
    
    if(!is_paginated){
      pagination = ``;
    }

    if(!isEmptyField(keyword)){
      condition += ` AND (city.name LIKE ?)`
      // condition += ` AND (l.name LIKE ? OR l.email LIKE ? OR l.phone LIKE ?)`
      // values.push(`%${keyword}%`,`%${keyword}%`,`%${keyword}%`);
      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }
    if(!isEmptyField(from_date)){
      condition += ` and DATE_FORMAT(city.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }
    if(!isEmptyField(to_date)){
      condition += ` and DATE_FORMAT(city.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }
    if (!isEmptyField(city_id)) {
      condition += ` AND city.id = ?`;
      values.push(`${city_id}`);
      countValues.push(`${city_id}`);
    }
    if (!isEmptyField(country_id)) {
      condition += ` AND city.country_id = ?`;
      values.push(`${country_id}`);
      countValues.push(`${country_id}`);
    }
  
    const text = `SELECT city.id, city.uid, city.country_id, city.name, CAST(city.operational AS SIGNED) as operational, city.status, city.created_at FROM ${Tables.CITIES} city
    INNER JOIN ${Tables.COUNTRIES} country ON city.country_id = country.id
    WHERE ${condition} ${pagination}`;
    
    const statement = {
      text,
      values,
      rowsOnly: true,
    };
  
    const countText = `SELECT COUNT(city.id) AS count FROM ${Tables.CITIES} city
    INNER JOIN ${Tables.COUNTRIES} country ON city.country_id = country.id
    WHERE ${condition}`;
    const countStatement = {
      text: countText,
      values: countValues,
      rowsOnly: true,
    };
  
    const [citiesRes, citiesCount] = await Promise.all([
      db.query(statement),
      db.query(countStatement),
    ]);
  
    return {
      count: citiesCount?.rows[0]?.count || 0,
      rows: citiesRes?.rows || [],
    };
  }
  
  static async getCityByColumn(body) {
    const {column = 'id', value = ""} = body;

    let text = `SELECT * from ${Tables.CITIES} Where ${column} = ?;`

    const statement = {
      text,
      values: [value],
      rowsOnly: true,
    }

    const result = await db.query(statement);

    return result.rows;
  };

  static async getOneByColumns(body) {
    const {columns = ['id'], values = [""], condition = "AND"} = body;
    let columnsString = ``
    columns.map(el=> {
      columnsString += `${el} = ? ${condition} `
    })

    const columnsStringLastIndex = columnsString.trim().lastIndexOf(condition);
    columnsString = columnsString.substr(0, columnsStringLastIndex);

    let text = `SELECT id, uid, name, status, operational from ${Tables.CITIES} WHERE ${columnsString} AND status = ?;`

    const statement = {
      text,
      values: [...values, Status.one],
      rowsOnly: true,
    }

    const result = await db.query(statement);

    return result.rows;

    // const [city] = await CitiesModel.getOneByColumns({
    //   columns: ["id", "country_id"],
    //   values: [city_id, country?.id],
    //   // condition: "AND"  //optional, by default AND
    // });
  };
}

module.exports = CitiesModel;
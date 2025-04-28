const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, UnknownUser } = require("../../constants/database");
const { MAX_AMENITIES } = require("../../constants/variables");
const {getUrlFromBucket }= require("../../utils/s3");
const {isEmptyField} = require("../../utils/common");


class LocationModel {

  static async listCountries(body) {
    const { sort, offset, limit, keyword, is_paginated } = body;

    const columns = `*`
    let condition = `where status = 1`;
    let pagination = `order by ${sort} limit ${offset}, ${limit}`;

    if (!is_paginated || is_paginated === "" || is_paginated.toString() === 'false') {
      pagination = ``;
    }

    if (keyword && keyword !== "") {
      condition += ` AND name LIKE '%${keyword}%'`
    }

    const text = `SELECT ${columns} from countries ${condition} ${pagination};`
    const countText = `SELECT Count(id) as count from countries ${condition}`;

    const statement = {
      text,
      values: [],
      rowsOnly: true,
    }

    const countStatement = {
      text: countText,
      values: [],
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

  static async getCountryByColumn(body) {
    const { column = 'id', value = "" } = body;

    let text = `SELECT * from countries Where ${column} = ?;`

    const statement = {
      text,
      values: [value],
      rowsOnly: true,
    }

    const result = await db.query(statement);

    return result.rows;
  };

  static async listStates(body) {
    const { country_id, sort, offset, limit, keyword, is_paginated } = body;

    const columns = `*`
    let condition = `where country_id = ${country_id} AND status = 1`;
    let pagination = `order by ${sort} limit ${offset}, ${limit}`;

    if (!is_paginated || is_paginated === "" || is_paginated.toString() === 'false') {
      pagination = ``;
    }

    if (keyword && keyword !== "") {
      condition += ` AND name LIKE '%${keyword}%'`
    }

    const text = `SELECT ${columns} from states ${condition} ${pagination};`
    const countText = `SELECT Count(id) as count from states ${condition}`;

    const statement = {
      text,
      values: [],
      rowsOnly: true,
    }

    const countStatement = {
      text: countText,
      values: [],
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

  static async listCities(body) {
    const { country_id, sort, offset, limit, keyword, is_paginated } = body;

    const columns = `*`
    let condition = `where country_id = ${country_id} AND status = 1`;
    let pagination = `order by ${sort} limit ${offset}, ${limit}`;

    if (!is_paginated || is_paginated === "" || is_paginated.toString() === 'false') {
      pagination = ``;
    }

    if (keyword && keyword !== "") {
      condition += ` AND name LIKE '%${keyword}%'`
    }

    const text = `SELECT ${columns} from cities ${condition} ${pagination};`
    const countText = `SELECT Count(id) as count from cities ${condition}`;

    const statement = {
      text,
      values: [],
      rowsOnly: true,
    }

    const countStatement = {
      text: countText,
      values: [],
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
    const { name = '', country_id = '' } = body;

    const statement = {
      text: `SELECT * from cities Where name = ? And country_id = ?;`,
      values: [name, country_id],
      rowsOnly: true,
    }

    const result = await db.query(statement);

    return result.rows;
  };

  static async getCityByColumn(body) {
    const { column = 'id', value = "" } = body;

    let text = `SELECT * from cities Where ${column} = ?;`

    const statement = {
      text,
      values: [value],
      rowsOnly: true,
    }

    const result = await db.query(statement);

    return result.rows;
  };

  static async getSphericalDistance(body) {
    const { user_id, res_id } = body;
    const point1 = `(select coordinates from users where id = ?)`;
    const point2 = `(select coordinates from restaurants where id = ?)`

    // let text = `select ST_Distance_Sphere((select coordinates from users where id = 8), point(-73.9898293, 40.7628267))`
    let text = `select ST_Distance_Sphere(${point1}, ${point2}) as distance`

    const statement = {
      text,
      values: [user_id, res_id],
      rowsOnly: true,
    }

    const result = await db.query(statement);

    return result.rows;
  };

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.LOCATION, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
        rows: affectedRows,
        msg: `${affectedRows} rows updated into ${Tables.LOCATION} table`
    };
  }

  static async listLocations(body) {
    const { sort, offset, limit, is_paginated, keyword, from_date, to_date, city_id, country_id, status } = body;
    const columns = `l.id, l.uid, l.name, l.about, l.city_id, l.country_id, l.status, l.created_at, CONCAT(m.basePath, '/', m.filename) as icon, CAST(l.operational AS SIGNED) as operational, city.name AS city_name`;
    let condition = `l.name IS NOT NULL`;
    const values = [];
    const countValues = [];

    let pagination = `ORDER BY l.${sort} LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY l.${sort}`;
    }

    if(!isEmptyField(keyword)){
      condition += ` AND l.name LIKE ?`

      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }
    if(!isEmptyField(from_date)){
      condition += ` and DATE_FORMAT(l.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }
    if(!isEmptyField(to_date)){
      condition += ` and DATE_FORMAT(l.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }
    if (!isEmptyField(city_id)) {
      condition += ` AND l.city_id = ?`;
      values.push(`${city_id}`);
      countValues.push(`${city_id}`);
    }
    if (!isEmptyField(country_id)) {
      condition += ` AND l.country_id = ?`;
      values.push(`${country_id}`);
      countValues.push(`${country_id}`);
    }
    if (!isEmptyField(status)) {
      condition += ` AND (l.status = ?)`
      values.push(status);
      countValues.push(status);
    }

    const text = `
    SELECT ${columns}, (
      SELECT COUNT(id) FROM ${Tables.RESTAURANTS} r
      WHERE r.location_id = l.id
    ) as restaurant_count
    FROM ${Tables.LOCATION} l
    LEFT JOIN ${Tables.MEDIA} m ON l.icon = m.id
    LEFT JOIN ${Tables.CITIES} city ON city.id = l.city_id
    WHERE ${condition} ${pagination}`;
  
    const countText = `SELECT Count(l.id) as count from ${Tables.LOCATION} l LEFT JOIN ${Tables.CITIES} city ON city.id = l.city_id WHERE ${condition}`;
  
    const statement = {
      text,
      values,
      rowsOnly: true
    };
  
    const countStatement = {
      text: countText,
      values: countValues,
      rowsOnly: true,
    };
  
    const listPr = db.query(statement);
    const countPr = db.query(countStatement);
  
    const promiseData = await Promise.all([listPr, countPr]);
    return {
      count: promiseData[1]?.rows[0]?.count,
      rows: promiseData[0]?.rows,
    };
  }
  

  static async insertLocation(locations){
    const statement = {...insertData(Tables.LOCATION , locations) , operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
        rows: affectedRows,
        msg: `${affectedRows} rows inserted into ${Tables.LOCATION} table`
    };
  }

  static async insertCountries(countries) {
    const statement = { ...insertData(Tables.COUNTRIES, countries), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.COUNTRIES} table`
    };
  }

  static async insertStates(states) {
    const statement = { ...insertData(Tables.STATES, states), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.STATES} table`
    };
  }

  static async insertCities(cities) {
    const statement = { ...insertData(Tables.CITIES, cities), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.CITIES} table`
    };
  }

  static async updateOneCountryById(columns, id) {
    const statement = { ...updateSingle(Tables.COUNTRIES, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.COUNTRIES} table`
    };
  }

  static async updateOneStateById(columns, id) {
    const statement = { ...updateSingle(Tables.STATES, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.STATES} table`
    };
  }

  static async updateOneCityById(columns, id) {
    const statement = { ...updateSingle(Tables.CITIES, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.CITIES} table`
    };
  }

  static async checkLocationId(location_id) {
    const statement = {
      text: `Select count(*) as location_count from ${Tables.LOCATION} where uid = ? ;`,
      values: [location_id]
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async findActiveRestaurantByLocations(location_id) {
    const statement = {
      text: `select
        l.uid AS id, l.name as title, l.icon as icon, l.about,
        JSON_ARRAYAGG(JSON_OBJECT('id',r.uid, 'title',r.name,'rating', r.star_rating,
        'reservation_count',(select count(res.id) from ${Tables.RESERVATIONS} res where (res.status = ? or res.status is null) and res.res_id = r.id),
        'category',(select JSON_ARRAYAGG(c.name) from ${Tables.CATEGORIES} c left join ${Tables.RESTAURANT_CATEGORIES} rc on c.id = rc.cat_id where rc.res_id = r.id and (rc.status = ? or rc.status is null) and (c.status = ? or c.status is null)),
        'offers_list',(select JSON_ARRAYAGG(JSON_OBJECT('start_time', TIME_FORMAT(sl.start_time, '%H:%i'), 'end_time', TIME_FORMAT(sl.end_time, '%H:%i'), 'seats_left', sl.seats_left, 'discount', sl.discount)) from ${Tables.SLOTS} sl where sl.res_id = r.id and sl.start_date = CURDATE() and (sl.status = ? or sl.status is null))
        ))as restaurants
        from ${Tables.LOCATION} l
        left join ${Tables.RESTAURANTS} r on l.id = r.location_id  
        WHERE l.status = ? and l.uid = ?
        and  (r.status = ? or r.status is null) group by l.id;  `,
      values: [1, 1, 1, 1, 1, location_id, 1]
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async findActiveRestaurantByLocationsWithAllDetails(location_id, restaurant_id) {
    const statement = {
      text: `select
        l.uid AS id, l.name as title, l.icon as icon, l.about,
        JSON_OBJECT('id',r.uid, 'title',r.name, 'about',r.about, 'menu', r.image_urls,
        'reservation_count',(select count(res.id) from ${Tables.RESERVATIONS} res where (res.status = ? or res.status is null) and res.res_id = r.id),
        'category',(select JSON_ARRAYAGG(c.name) from ${Tables.CATEGORIES} c left join ${Tables.RESTAURANT_CATEGORIES} rc on c.id = rc.cat_id where rc.res_id = r.id and (rc.status = ? or rc.status is null) and (c.status = ? or c.status is null)),
        'offers_list',(select JSON_ARRAYAGG(JSON_OBJECT('start_time', TIME_FORMAT(sl.start_time, '%H:%i'), 'end_time', TIME_FORMAT(sl.end_time, '%H:%i'),'seats_left', sl.seats_left, 'discount', sl.discount)) from ${Tables.SLOTS} sl where sl.res_id = r.id and sl.start_date = CURDATE() and (sl.status = ? or sl.status is null)),
        'amenities',(select JSON_ARRAYAGG(JSON_OBJECT('name',am.name,'icon', am.icon)) from ${Tables.AMENITIES} am left join ${Tables.RESTAURANT_AMENITIES} ra on ra.amen_id = am.id where ra.res_id = r.id and (ra.status = ? or ra.status is null) and (am.status = ? or am.status is null) order by ra.id desc limit ${MAX_AMENITIES}),
        'reviews', (select JSON_ARRAYAGG(JSON_OBJECT('details',ur.details, 'rating',ur.rating, 'review_time',(UNIX_TIMESTAMP(ur.created_at) * 1000), 'username',COALESCE(concat(u.first_name,' ',u.last_name),'${UnknownUser}'))) as reviews from ${Tables.REVIEWS} ur left join ${Tables.RESTAURANTS} r ON ur.res_id = r.id left join ${Tables.USERS} u on ur.user_id = u.id where (r.status = 1 or r.status is null) and (u.status = 1 or u.status is null)),
        'dinning_options',(select JSON_ARRAYAGG(d.name) from ${Tables.DINNINGS} d left join ${Tables.RESTAURANT_DINNINGS} rd on d.id = rd.dinning_id where rd.res_id = r.id and (d.status = ? or d.status is null) and (rd.status = ? or rd.status is null)) 
        )as restaurant
        from ${Tables.LOCATION} l
        left join ${Tables.RESTAURANTS} r on l.id = r.location_id  
        WHERE l.status = ? and l.uid = ? and r.uid = ?
        and  (r.status = ?);  `,
      values: [1, 1, 1, 1, 1, 1, 1, 1, 1, location_id, restaurant_id, 1]
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async getOneByuId(uid){
    const statement = {
        text: `SELECT * FROM ${Tables.LOCATION} where uid = ?;`,
        values: [uid],
    }
    const result = await db.query(statement);
    return result.rows
}

  static async getFileNameByLocationId(uid){
    const statement  = {
      text: `SELECT l.uid as location_uid , l.id as location_id, m.id as media_id, m.filename from ${Tables.LOCATION} as l left join ${Tables.MEDIA} as m on l.media_id = m.id where l.uid = ?;`,
      values:[uid]
    }
    const result = await db.query(statement);
    return result.rows[0];
  }

  static async getLocationByColumn(body) {
    const {column = 'id', value = ""} = body;

    let text = `SELECT * from ${Tables.LOCATION} Where ${column} = ?;`

    const statement = {
      text,
      values: [value],
      rowsOnly: true,
    }

    const result = await db.query(statement);

    return result.rows;
  };
}

module.exports = LocationModel;
const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Status, Bit,UnknownUser } = require("../../constants/database");
const {isEmptyField} = require("../../utils/common.js");

class ReviewsModel {
  static async listReviewsByUser(body) {
    const {user_id, sort_by, order, offset, limit, keyword, is_paginated} = body;

    const columns = `${Tables.REVIEWS}.uid, ${Tables.REVIEWS}.rating, ${Tables.REVIEWS}.details, ${Tables.REVIEWS}.approved, ${Tables.RESTAURANTS}.name as res_name`
    let condition = `where ${Tables.REVIEWS}.user_id = ? AND ${Tables.REVIEWS}.status = 1`;
    const sort = `${Tables.REVIEWS}.${sort_by} ${order}`;
    // let pagination = `order by ${sort} limit ?, ?`;
    let pagination = `order by ${sort} limit ${offset}, ${limit}`;

    // let values = [user_id, offset, limit];
    const values = [user_id];
    const countValues = [user_id];

    
    if(!is_paginated || is_paginated === "" || is_paginated.toString() === 'false'){
      pagination = ``;
    }

    if(keyword && keyword !== ""){
      condition += ` AND ${Tables.RESTAURANTS}.name LIKE ?`
      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }

    const text = `SELECT ${columns} from ${Tables.REVIEWS} INNER JOIN ${Tables.RESTAURANTS} ON ${Tables.REVIEWS}.res_id = ${Tables.RESTAURANTS}.id ${condition} ${pagination};`
    const countText = `SELECT Count(${Tables.REVIEWS}.id) as count from ${Tables.REVIEWS} INNER JOIN ${Tables.RESTAURANTS} ON ${Tables.REVIEWS}.res_id = ${Tables.RESTAURANTS}.id ${condition};`;
    
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

  static async listReviewsByRestaurantIds(body) {
    const {restaurantIds, sort_by, order, offset, limit, keyword, is_paginated} = body;

    const restaurantIdsCommaSep = restaurantIds.join(",")
    const columns = `${Tables.REVIEWS}.uid, ${Tables.REVIEWS}.rating, ${Tables.REVIEWS}.details, ${Tables.REVIEWS}.approved, ${Tables.RESTAURANTS}.name as res_name`
    let condition = `where res_id in (?) AND ${Tables.REVIEWS}.status = 1`;
    const sort = `${Tables.REVIEWS}.${sort_by} ${order}`;
    let pagination = `order by ${sort} limit ${offset}, ${limit}`;

    // let values = [user_id, offset, limit];
    const values = [restaurantIdsCommaSep];
    const countValues = [restaurantIdsCommaSep];

    
    if(!is_paginated || is_paginated === "" || is_paginated.toString() === 'false'){
      pagination = ``;
    }

    if(keyword && keyword !== ""){
      condition += ` AND name LIKE ?`
      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }

    const text = `SELECT ${columns} from ${Tables.REVIEWS} INNER JOIN ${Tables.RESTAURANTS} ON ${Tables.REVIEWS}.res_id = ${Tables.RESTAURANTS}.id ${condition} ${pagination};`
    const countText = `SELECT Count(${Tables.REVIEWS}.id) as count from ${Tables.REVIEWS} INNER JOIN ${Tables.RESTAURANTS} ON ${Tables.REVIEWS}.res_id = ${Tables.RESTAURANTS}.id ${condition};`;
    
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

  static async findReview(user_id, res_id) {
    const statement = {
        text: `select id, status from ${Tables.REVIEWS} where user_id = ? and res_id = ?;`,
        values: [user_id, res_id],
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async findReviewByUid(uid) {
    const statement = {
        text: `select id, status from ${Tables.REVIEWS} where uid = ?;`,
        values: [uid],
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async insert(reviews) {
    const statement = { ...insertData(Tables.REVIEWS, reviews), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
        rows: affectedRows,
        msg: `${affectedRows} rows inserted into ${Tables.REVIEWS} table`
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.REVIEWS, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
        rows: affectedRows,
        msg: `${affectedRows} rows updated into ${Tables.REVIEWS} table`
    };
  }

  static async getAccumlatedReview(res_id) {
    const statement = {
        text: `select sum(rating) from ${Tables.REVIEWS} where res_id = ? GROUP BY res_id;`,
        values: [res_id],
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async listReviewsByRestaurant(body) {
    const {
      res_id, 
      sort_by, 
      order, 
      offset, 
      limit, 
      keyword, 
      is_paginated,
      from_date,
      to_date,
      rating,
      review_id
    } = body;

    const columns = `rv.uid as id, rv.rating, rv.details, UNIX_TIMESTAMP(rv.created_at) as review_date`
   // let condition = `WHERE rv.res_id = ? AND rv.status = ${Status.one}`;
   let condition = (res_id && res_id !== "") ? `WHERE rv.res_id = ? AND rv.status = ${Status.one}` : `WHERE rv.status = ${Status.one}`;

    // const resColumns = `rs.uid rs.name`
    // const text = `SELECT ${resColumns}, ${reviews} FROM ${Tables.RESTAURANTS} rs WHERE uid = ?;`

    const sort = `rv.${sort_by} ${order}`;
    let pagination = `order by ${sort} limit ${offset}, ${limit}`;
   
    const values = res_id ? [res_id] : [];
    const countValues = res_id ? [res_id] : [];

    
    if(!is_paginated || is_paginated === "" || is_paginated.toString() === 'false'){
      pagination = ``;
    }

    if (from_date && from_date !== '') {
      condition += `${res_id ? ' AND' : ' WHERE'} DATE_FORMAT(rv.created_at, '%Y-%m-%d %H:%i:%s') >= ?`;
      values.push(from_date);
      countValues.push(from_date);
    }

    if (to_date && to_date !== '') {
      condition += `${res_id || from_date ? ' AND' : ' WHERE'} DATE_FORMAT(rv.created_at, '%Y-%m-%d %H:%i:%s') <= ?`;
      values.push(to_date);
      countValues.push(to_date);
    }


    const firstname = `CASE WHEN usr.first_name IS NULL OR usr.first_name = '' THEN '' ELSE CONCAT(usr.first_name , ' ') END`
    const lastname = `CASE WHEN usr.last_name IS NULL OR usr.last_name = '' THEN '' ELSE usr.last_name END`

if (keyword && keyword !== "") {
  condition += ` AND (IFNULL(NULLIF(CONCAT(${firstname}, ${lastname}), '') , '${UnknownUser}') LIKE ? 
                OR usr.email LIKE ?
                OR res.email LIKE ?
                OR res.name LIKE ?)`;
  values.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  countValues.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
}

    if(rating && rating !== ''){
      condition += ` AND rv.rating = ?`
      values.push(rating);
      countValues.push(rating);
    }

    if(review_id && review_id !== ''){
      condition += ` AND rv.uid = ?`
      values.push(review_id);
      countValues.push(review_id);
    }

    // const usrColunms =
    //   "'first_name', usr.first_name," +
    //   "'last_name', usr.last_name";
    
    // const user = `(SELECT JSON_OBJECT(${usrColunms}) FROM ${Tables.USERS} usr WHERE usr.id = rv.user_id) as user`
    // const user = `(SELECT IFNULL(CONCAT(usr.first_name + ' ' + usr.last_name) , '${UnknownUser}') AS name FROM ${Tables.USERS} usr WHERE usr.id = rv.user_id) as user`

    const user = `IFNULL(NULLIF(CONCAT(${firstname}, ${lastname}), '') , '${UnknownUser}') as user_name, usr.email as user_email`
    const restaurant = `(SELECT JSON_OBJECT('id', res.uid, 'name', res.name, 'email', res.email) FROM ${Tables.RESTAURANTS} res WHERE res.id = rv.res_id) as restaurant_info`
    const reviewsText = `SELECT ${columns},${user}, ${restaurant}  FROM ${Tables.REVIEWS} rv
      INNER JOIN ${Tables.USERS} usr ON usr.id = rv.user_id
      INNER JOIN ${Tables.RESTAURANTS} res ON res.id = rv.res_id
      ${condition} ${pagination};`

    const countReviewText = `SELECT Count(rv.id) as count FROM ${Tables.REVIEWS} rv
      INNER JOIN ${Tables.USERS} usr ON usr.id = rv.user_id
      INNER JOIN ${Tables.RESTAURANTS} res ON res.id = rv.res_id
      ${condition}`;
    
    const statement = {
      text: reviewsText,
      values,
      rowsOnly: true,
    }

    const countStatement = {
      text: countReviewText,
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

  static async getOverallReviewsByRestaurant(body) {
    const {res_id} = body;

    let commonCondition = `WHERE rv.res_id = rs.id AND rv.status = ${Status.one} and rv.approved = ${Bit.one}`;

    const values = [res_id];
    // const countValues = [res_id];

    const reviewsAvg = `SELECT AVG(rv.rating) as avg_rating FROM ${Tables.REVIEWS} rv ${commonCondition} GROUP BY rv.res_id`

    const reviews5Counting = `SELECT COUNT(rv.rating) FROM ${Tables.REVIEWS} rv ${commonCondition} AND rv.rating = 5 GROUP BY rv.res_id`
    const reviews4Counting = `SELECT COUNT(rv.rating) FROM ${Tables.REVIEWS} rv ${commonCondition} AND rv.rating >= 4 AND rv.rating < 5 GROUP BY rv.res_id`
    const reviews3Counting = `SELECT COUNT(rv.rating) FROM ${Tables.REVIEWS} rv ${commonCondition} AND rv.rating >= 3 AND rv.rating < 4 GROUP BY rv.res_id`
    const reviews2Counting = `SELECT COUNT(rv.rating) FROM ${Tables.REVIEWS} rv ${commonCondition} AND rv.rating >= 2 AND rv.rating < 3 GROUP BY rv.res_id`
    const reviews1Counting = `SELECT COUNT(rv.rating) FROM ${Tables.REVIEWS} rv ${commonCondition} AND rv.rating >= 1 AND rv.rating < 2 GROUP BY rv.res_id`
    
    // const text = `SELECT count_5.star_5_count, count_4.star_4_count FROM (${reviews5Counting}) as count_5, (${reviews4Counting}) as count_4`
    const text = `SELECT (${reviewsAvg}) as avg_rating, (${reviews5Counting}) as star_5_count,(${reviews4Counting}) as star_4_count, (${reviews3Counting}) as star_3_count, (${reviews2Counting}) as star_2_count, (${reviews1Counting}) as star_1_count FROM ${Tables.RESTAURANTS} rs WHERE id = ?`
    
    const statement = { text: text, values, rowsOnly: true }

    const result = await db.query(statement);
    
    return result.rows
  };

  static async list(body) {
    const {
      sort,
      limit,
      offset, 
      keyword, 
      is_paginated,
      from_date,
      to_date,
      rating,
      review_id,
      res_id,
      reservation_id
    } = body;

    const columns = `
      rv.uid as id, 
      rv.rating, 
      rv.details, 
      UNIX_TIMESTAMP(rv.created_at) as review_date`
    let condition =  `WHERE rv.status = ${Status.one}`;

    let pagination = `ORDER BY rv.${sort} LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY rv.${sort}`;
    }

    const values = [];
    const countValues = [];

    const firstname = `CASE WHEN usr.first_name IS NULL OR usr.first_name = '' THEN '' ELSE CONCAT(usr.first_name , ' ') END`
    const lastname = `CASE WHEN usr.last_name IS NULL OR usr.last_name = '' THEN '' ELSE usr.last_name END`

    if(!isEmptyField(keyword)){
      condition += ` AND (res.name LIKE ? OR IFNULL(NULLIF(CONCAT(${firstname}, ${lastname}), '') , '${UnknownUser}') LIKE ?)`;
      values.push(`%${keyword}%`, `%${keyword}%`);
      countValues.push(`%${keyword}%`, `%${keyword}%`);
    }
    if(!isEmptyField(from_date)){
      condition += ` AND DATE_FORMAT(rv.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }
    if(!isEmptyField(to_date)){
      condition += ` AND DATE_FORMAT(rv.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }
    if(!isEmptyField(rating)){
      condition += ` AND rv.rating = ?`
      values.push(rating);
      countValues.push(rating);
    }
    if(!isEmptyField(review_id)){
      condition += ` AND rv.uid = ?`
      values.push(review_id);
      countValues.push(review_id);
    }
    if(!isEmptyField(res_id)){
      condition += ` AND res.uid = ?`
      values.push(res_id);
      countValues.push(res_id);
    }
    if(!isEmptyField(reservation_id)){
      condition += ` AND rev.uid = ?`
      values.push(reservation_id);
      countValues.push(reservation_id);
    }

    const user = `IFNULL(NULLIF(CONCAT(${firstname}, ${lastname}), '') , '${UnknownUser}') as username, usr.email as user_email, usr.country_code AS country_code, usr.mobile AS user_mobile, usr.status as user_status, usr.uid as user_id`
    const restaurant = `JSON_OBJECT('id', res.uid, 'name', res.name, 'email', res.email) as restaurant_info`
    const reservation = `rev.uid AS reservation_id`
    const reviewsText = `SELECT ${columns},${user},${restaurant},${reservation}  FROM ${Tables.REVIEWS} rv
      INNER JOIN ${Tables.USERS} usr ON usr.id = rv.user_id
      INNER JOIN ${Tables.RESTAURANTS} res ON res.id = rv.res_id
      LEFT JOIN ${Tables.RESERVATIONS} rev ON rev.id = reservation_id
      ${condition} ${pagination};`

    const countReviewText = `SELECT Count(rv.id) as count FROM ${Tables.REVIEWS} rv
      INNER JOIN ${Tables.USERS} usr ON usr.id = rv.user_id
      INNER JOIN ${Tables.RESTAURANTS} res ON res.id = rv.res_id
      LEFT JOIN ${Tables.RESERVATIONS} rev ON rev.id = reservation_id
      ${condition}`;
    
    const statement = {
      text: reviewsText,
      values,
      rowsOnly: true,
    }

    const countStatement = {
      text: countReviewText,
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

}

module.exports = ReviewsModel;
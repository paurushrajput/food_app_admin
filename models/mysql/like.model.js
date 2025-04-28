const {
  db,
  inMapper,
  insertData,
  updateSingle,
} = require("../../dbConfig/dbConnect");
const { Tables, Operations, Status, Bit } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common.js");
const { pgDB, getPGDatabase } = require("../../dbConfig/pgConnect.js");

class LikeModel {

  static async getLike(body) {
    const {
      feed_id,
      post_type,
      sort,
      limit,
      offset,
      is_paginated,
    } = body;

    let pagination = ` LIMIT ${limit} OFFSET ${offset}`;
    if (!is_paginated) {
      pagination = `ORDER BY ${sort}`;
    }
    const values = [feed_id, post_type];
    let query = `SELECT f.id,f.uid,f.post_type,f.post_id,f.user_id,
      f.created_at FROM ${Tables.LIKE} as f WHERE f.post_id = $1 AND f.post_type = $2  ${pagination}`
    const statement = {
      text: query,
      values: values,
      rowsOnly: true,
    };
    let countQuery = `SELECT count(*) as likes_count  
    FROM ${Tables.LIKE} as f WHERE f.post_id = $1 AND f.post_type = $2 `
    const countStatement = {
      text: countQuery,
      values: values,
      rowsOnly: true,
    };
    const pgDB = await getPGDatabase()
    const result = await pgDB.simpleQuery(statement);
    const countPr = pgDB.simpleQuery(countStatement);
    const promiseData = await Promise.allSettled([result, countPr]);

    return {
      count: promiseData[1]?.value?.rows[0]?.likes_count,
      rows: promiseData[0]?.value?.rows,
    };
  }
}

module.exports = LikeModel;

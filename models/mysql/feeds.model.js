const {
  db,
  inMapper,
  insertData,
  updateSingle,
} = require("../../dbConfig/dbConnect");
const { Tables, Operations, Status, Bit } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common.js");
const { BannerSize } = require("../../constants/banner.js");
const { pgDB, getPGDatabase } = require("../../dbConfig/pgConnect.js");

class FeedModel {

  static async list(body) {
    const {
      sort,
      limit,
      offset,
      is_paginated,
    } = body;

    let condition = `WHERE f.deleted_at IS NULL`;
    const values = [];
    const countValues = [];

    let orderBy = `ORDER BY ${sort}`
    let pagination = ` LIMIT ${limit} OFFSET ${offset}`;
    if (!is_paginated) {
      pagination = `ORDER BY ${sort}`;
    }

    let query = `SELECT f.uid as feed_id,f.user_id,f.post_id,f.post_type,
    f.details,
    COALESCE((f.details->>'status')::integer,1) as status,
    (f.details->>'like_count')::integer as like_count,
    (f.details->>'comment_count')::integer as comment_count ,
    TRUNC(EXTRACT(EPOCH FROM f.created_at)) as created_at
    FROM ${Tables.FEEDS} as f ${condition} ${pagination}  `
 
    const statement = {
      text: query,
      values: values,
      rowsOnly: true,
    };

    let countQuery = `SELECT count(*) as feeds_count  
    FROM ${Tables.FEEDS} as f ${condition} `

    const countStatement = {
      text: countQuery,
      values: countValues,
      rowsOnly: true,
    };

    const pgDB = await getPGDatabase()

    const listPr = pgDB.simpleQuery(statement);
    const countPr = pgDB.simpleQuery(countStatement);

    const promiseData = await Promise.allSettled([listPr, countPr]);

    return {
      count: promiseData[1]?.value?.rows[0]?.feeds_count,
      rows: promiseData[0]?.value?.rows,
    };
  }

  static async getFeed(body) {
    const {
      feed_id
    } = body;

    const values = [feed_id];

    let query = `SELECT f.id,f.uid,f.post_type,f.post_id,f.user_id,
      details,f.created_at FROM ${Tables.FEEDS} as f WHERE uid = $1 `
 
    const statement = {
      text: query,
      values: values,
      rowsOnly: true,
    };
  
    const pgDB = await getPGDatabase()

    const result = await pgDB.simpleQuery(statement);

    return {
      rows: result?.rows ?? []
    };
  }

  static async update(body) {
    const {
      feed_id,
      status
    } = body;

    const values = [status,feed_id];

    let query = `UPDATE ${Tables.FEEDS} 
      SET details = jsonb_set(details, '{status}',$1)
      WHERE uid = $2 ;`
 
    const statement = {
      text: query,
      values: values,
    };
  
    const pgDB = await getPGDatabase()

    const result = await pgDB.simpleQuery(statement);

    return {
      count:result?.rowCount
    };
  }

}

module.exports = FeedModel;

const {
  db,
  inMapper,
  insertData,
  updateSingle,
} = require("../../dbConfig/dbConnect");
const { Tables, Operations, Status, Bit } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common.js");
const { BannerSize } = require("../../constants/banner.js");

class WaysToEarnModel {
  static async insert(payload) {
    const statement = {
      ...insertData(Tables.WAYS_TO_EARN, payload),
      operation: Operations.INSERT,
    };
    const result = await db.query(statement);
    const affectedRows = Number(
      JSON.parse(JSON.stringify(result))?.rows?.affectedRows
    );
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.BANNER} table`,
    };
  }

  static async list(body) {
    const {
      sort,
      limit,
      offset,
      is_paginated,
    } = body;

    let condition = `WHERE wte.deleted_at IS NULL`;
    const values = [];
    const countValues = [];

    let pagination = `ORDER BY ${sort} limit ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY ${sort}`;
    }
 
    const statement = {
      text: `SELECT 
        wte.uid as id, 
        wte.title,
        wte.type,
        wte.action,
        wte.coins,
        wte.coin_currency,
        wte.button_name, 
        wte.status,
        wte.created_at,
        wte.sequence, 
        COALESCE(CONCAT(m.basePath,'/',m.filename),'') as icon
        FROM ${Tables.WAYS_TO_EARN} wte 
        LEFT JOIN ${Tables.MEDIA} m ON wte.icon = m.id
        ${condition} ${pagination};`,
      values: values,
      rowsOnly: true,
    };

    const countText = `SELECT count(wte.id) as count FROM ${Tables.WAYS_TO_EARN} wte ${condition};`;

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

  static async updateOneById(columns, id) {
    const statement = {
      ...updateSingle(Tables.WAYS_TO_EARN, columns, id),
      operation: Operations.UPDATE,
    };
    const result = await db.query(statement);
    const affectedRows = Number(
      JSON.parse(JSON.stringify(result))?.rows?.affectedRows
    );
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.BANNER} table`,
    };
  }

  static async getOneByuId(uid) {
    const statement = {
      text: `SELECT id ,uid,title,type,action,coins,coin_currency,icon,button_name,sequence,status FROM ${Tables.WAYS_TO_EARN} where uid = ?;`,
      values: [uid],
    };
    const result = await db.query(statement);
    return result.rows;
  }

}

module.exports = WaysToEarnModel;

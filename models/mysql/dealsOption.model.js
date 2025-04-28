const {
  db,
  inMapper,
  insertData,
  updateSingle,
} = require("../../dbConfig/dbConnect.js");
const { Tables, Operations, } = require("../../constants/database.js");
const { isEmptyField } = require("../../utils/common.js");

class DealOptionModel {

  static async list(body) {
    const { sort, offset, limit, is_paginated, actual_price, discounted_price, title, max_use, deal_id } = body;

    let condition = `WHERE d.deleted_at IS NULL`;
    const values = [];
    const countValues = [];

    let pagination = `ORDER BY d.${sort} limit ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY d.${sort}`;
    }

    if (!isEmptyField(title)) {
      condition += ` AND (do.title LIKE ?  )`
      values.push(`%${title}%`);
      countValues.push(`%${title}%`);
    }

    if (!isEmptyField(actual_price)) {
      condition += ` AND (do.actual_price = ?  )`
      values.push(actual_price);
      countValues.push(actual_price);
    }

    if (!isEmptyField(discounted_price)) {
      condition += ` AND (do.discounted_price = ?  )`
      values.push(discounted_price);
      countValues.push(discounted_price);
    }

    if (!isEmptyField(max_use)) {
      condition += ` AND (do.max_use = ?  )`
      values.push(max_use);
      countValues.push(max_use);
    }

    if (!isEmptyField(deal_id)) {
      condition += ` AND (d.uid = ?  )`
      values.push(deal_id);
      countValues.push(deal_id);
    }

    const statement = {
      text: `SELECT 
        do.uid as id, 
        do.title, 
        do.actual_price, 
        do.discounted_price,
        do.max_use,
        do.show_on_home_page, 
        do.created_at,
        do.deleted_at,
        d.uid as deal_id,
        d.title as deal_title,
        do.uses_per_user,
        do.max_qty_pr_purchase,
        do.pax_comission_type,
        do.pax_details

        FROM ${Tables.DEAL_OPTION} do
        JOIN ${Tables.DEALS} d ON do.deal_id = d.id 
        ${condition} ${pagination};`,
      values: values,
      rowsOnly: true,
    }

    const countText = `SELECT count(d.id) as count FROM ${Tables.DEAL_OPTION} do JOIN ${Tables.DEALS} d ON do.deal_id = d.id ${condition};`;

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

  static async insert(deals, transaction) {
    const statement = {
      ...insertData(Tables.DEAL_OPTION, deals),
      operation: Operations.INSERT,
      transaction,
    };
    const result = await db.query(statement);
    const affectedRows = Number(
      JSON.parse(JSON.stringify(result))?.rows?.affectedRows
    );
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.DEAL_OPTION} table`,
    };
  }

  static async updateOneById(columns, id, transaction) {
    const statement = {
      ...updateSingle(Tables.DEAL_OPTION, columns, id),
      operation: Operations.UPDATE,
      transaction,
    };
    const result = await db.query(statement);
    const affectedRows = Number(
      JSON.parse(JSON.stringify(result))?.rows?.affectedRows
    );
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.DEAL_OPTION} table`,
    };
  }

  static async getOneByuId(uid, transaction) {
    const statement = {
      text: `SELECT id, title, actual_price, discounted_price, max_use, deal_id, show_on_home_page FROM ${Tables.DEAL_OPTION} where uid = ?;`,
      values: [uid],
      transaction
    };
    const result = await db.query(statement);
    return result.rows;
  }
}

module.exports = DealOptionModel;

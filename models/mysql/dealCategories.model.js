const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Bit } = require("../../constants/database");
const { getUrlFromBucket } = require("../../utils/s3");
const MediaModel = require("./media.model");
const { isEmptyField } = require("../../utils/common.js");

class DealCategoriesModel {

  static async insert(categories,transaction = null) {
    const statement = { ...insertData(Tables.DEAL_CATEGORIES, categories), operation: Operations.INSERT , transaction };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.DEAL_CATEGORIES} table`
    };
  }

  static async deleteAllByColumn(body, transaction = null) {
    const { column = "id", value = "" } = body;

    let text = `DELETE FROM ${Tables.DEAL_CATEGORIES} WHERE ${column} = ?;`
    let statement = {
        text,
        values: [value],
        transaction
    }
    const result = await db.query(statement);
    const affectedRows = Number(
      JSON.parse(JSON.stringify(result))?.rows?.affectedRows
    );
   
    return {
        rows: affectedRows,
        msg: `${affectedRows} rows deleted into ${Tables.DEAL_CATEGORIES} table`
    };
  }

  static async checkDealCatExist(body, transaction = null) {
    const { deal_id,cat_id } = body;

    let text = `SELECT id,deal_id,cat_id FROM ${Tables.DEAL_CATEGORIES}
     WHERE deal_id = ? AND cat_id = ?  ;`
    let statement = {
        text,
        values: [deal_id,cat_id],
        // transaction
    }
    const result = await db.query(statement);
    
    return result.rows[0]
  }

}
module.exports = DealCategoriesModel;
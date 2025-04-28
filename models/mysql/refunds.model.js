const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations } = require("../../constants/database");
const {isEmptyField} = require("../../utils/common.js");

class RefundsModel {
  static async insert(data, transaction = null) {
    const statement = { ...insertData(Tables.REFUNDS, data), operation: Operations.INSERT, transaction };
    const result = await db.query(statement, true);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      lastInsertId: result.lastInsertId,
      msg: `${affectedRows} rows inserted into ${Tables.REFUNDS} table`
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.REFUNDS, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.REFUNDS} table`
    };
  }
}

module.exports = RefundsModel;
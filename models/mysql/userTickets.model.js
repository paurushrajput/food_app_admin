const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations } = require("../../constants/database");

class UserTicketModel {
  static async insert(data) {
    const statement = { ...insertData(Tables.USER_TICKET, data), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.USER_TICKET} table`
    };
  }
}

module.exports = UserTicketModel;
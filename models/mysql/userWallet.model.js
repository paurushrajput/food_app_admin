const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, UnknownUser, Status, Bit } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");

class UserWalletModel {
  static async insert(data, transaction = null) {
    const statement = { ...insertData(Tables.USER_WALLET, data), operation: Operations.INSERT, transaction };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      lastInsertId: result.lastInsertId,
      msg: `${affectedRows} rows inserted into ${Tables.USER_WALLET} table`
    };
  }

  static async updateOneById(columns, id, transaction = null) {
    const statement = { ...updateSingle(Tables.USER_WALLET, columns, id), operation: Operations.UPDATE, transaction };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.USER_WALLET} table`
    };
  }

  static async getOneByColumn(body, transaction = null) {
    const { column = 'id', value = "" } = body;

    let text = `SELECT id, uid, amount from ${Tables.USER_WALLET} WHERE ${column} = ? AND deleted_at IS NULL;`

    const statement = {
      text,
      values: [value],
      rowsOnly: true,
      transaction
    }

    const result = await db.query(statement);

    return result.rows;
  };

  static async getOneByColumns(body) {
    const { columns = ['id'], values = [""] } = body;
    let columnsString = ``
    columns.map(el => {
      columnsString += `${el} = ? AND `
    })

    const columnsStringLastIndex = columnsString.trim().lastIndexOf('AND');
    columnsString = columnsString.substr(0, columnsStringLastIndex);

    let text = `SELECT id, uid, name, email, phone_number from ${Tables.USER_WALLET} WHERE ${columnsString} AND deleted_at IS NULL;`

    const statement = {
      text,
      values: [...values],
      rowsOnly: true,
    }

    const result = await db.query(statement);

    return result.rows;
  };

  static async updateUserWallet(userId, amount, transaction = null) {
    const statement = {
        text: `INSERT INTO ${Tables.USER_WALLET} (user_id, amount) VALUES (?, ?) ON DUPLICATE KEY UPDATE amount = amount + ?;`,
        values: [userId, amount, amount],
        transaction
    }
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      // lastInsertId: result.lastInsertId,
      lastInsertId: result?.rows?.insertId,
      msg: `${affectedRows} rows inserted into ${Tables.USER_WALLET} table`
    };
    return result.rows;
  }
}

module.exports = UserWalletModel;

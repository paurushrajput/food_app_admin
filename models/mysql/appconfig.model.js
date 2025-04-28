const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Status, Bit } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");

class AppConfig {
  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.APPCONFIG, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.APPCONFIG} table`
    };
  }

  static async insert(data) {
    const statement = { ...insertData(Tables.APPCONFIG, data), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.APPCONFIG} table`
    };
  }

  static async getByValue(data) {
    const statement = {
      text: `SELECT * FROM ${Tables.APPCONFIG} where title = ?;`,
      values: [data],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async getOneByuId(uid) {
    const statement = {
      text: `SELECT id, title, value, status FROM ${Tables.APPCONFIG} where uid = ?;`,
      values: [uid],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async listAll(body) {
    const { status, title } = body;
    
    
    const values = [];

    let condition= ` WHERE 1 `
    if(!isEmptyField(title)){
      condition += ' AND title = ? '
      values.push(title)
    }

    if (status !== undefined) {
      condition += ' AND status = ?';
      values.push(status);
    }

    let text = `SELECT uid,  title ,status, value   FROM ${Tables.APPCONFIG}
     ${condition} ; `;

    const statement = {
      text,
      values,
    };

    const result = await db.query(statement);
    return result.rows;
  }

  static async updateAppVersion(value, id) {
    const statement = {
      text: `UPDATE ${Tables.APPCONFIG} set value = ? where id =  ? ;`,
      values: [JSON.stringify(value), id],
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async getAppConfigByTitle(titles) {
    if (!Array.isArray(titles)) {
      titles = [titles]
    }
    const statement = {
      text: `SELECT uid as id, title, value FROM ${Tables.APPCONFIG} where title IN (${inMapper(titles)});`,
      values: [],
    }
    const result = await db.query(statement);
    return result.rows;
  }

}

module.exports = AppConfig;
const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations } = require("../../constants/database");

class StatesModel {
  static async listStates(body) {
    const {country_id, sort,  offset, limit, keyword, is_paginated} = body;

    const columns = `*`
    let condition = `where country_id = ? AND status = 1`;
    let pagination = `order by ${sort} limit ${offset}, ${limit}`;
    
    const values = [country_id];
    const countValues = [country_id];

    if(!is_paginated || is_paginated === "" || is_paginated.toString() === 'false'){
      pagination = ``;
    }

    if(keyword && keyword !== ""){
      condition += ` AND name LIKE ?`
      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }

    const text = `SELECT ${columns} from states ${condition} ${pagination};`
    const countText = `SELECT Count(id) as count from states ${condition}`;
    
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
  
  static async insert(states) {
    const statement = { ...insertData(Tables.STATES, states), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
        rows: affectedRows,
        msg: `${affectedRows} rows inserted into ${Tables.STATES} table`
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.STATES, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
        rows: affectedRows,
        msg: `${affectedRows} rows updated into ${Tables.STATES} table`
    };
  }
}

module.exports = StatesModel;
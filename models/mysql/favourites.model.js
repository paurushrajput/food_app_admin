const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations } = require("../../constants/database");

class FavouritesModel {
  static async listFavRestaurants(body) {
      const {sort_by, order, offset, limit, keyword, is_paginated, user} = body;

      const columns = `*`
      let condition = `where ${Tables.USER_FAVS}.status = 1 and ${Tables.USER_FAVS}.user_id = ?`;
      const sort = `${Tables.USER_FAVS}.${sort_by} ${order}`;
      let pagination = `order by ${sort} limit ${offset}, ${limit}`;
      
      const values = [user.id];
      const countValues = [user.id];

      if(!is_paginated || is_paginated === "" || is_paginated.toString() === 'false'){
        pagination = ``;
      }

      if(keyword && keyword !== ""){
        condition += ` AND ${Tables.RESTAURANTS}.name LIKE ?`
        values.push(`%${keyword}%`);
        countValues.push(`%${keyword}%`);
      }

      const text = `SELECT ${columns} from ${Tables.USER_FAVS} INNER JOIN ${Tables.RESTAURANTS} ON ${Tables.USER_FAVS}.res_id = ${Tables.RESTAURANTS}.id ${condition} ${pagination};`
      const countText = `SELECT Count( ${Tables.USER_FAVS}.id) as count from ${Tables.USER_FAVS} INNER JOIN ${Tables.RESTAURANTS} ON ${Tables.USER_FAVS}.res_id = ${Tables.RESTAURANTS}.id ${condition}`;
      
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

  static async findFavRestaurant(user_id, res_id) {
    const statement = {
        text: `select id, status from ${Tables.USER_FAVS} where user_id = ? and res_id = ?;`,
        values: [user_id, res_id],
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async insert(favrestaurants) {
    const statement = { ...insertData(Tables.USER_FAVS, favrestaurants), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
        rows: affectedRows,
        msg: `${affectedRows} rows inserted into ${Tables.USER_FAVS} table`
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.USER_FAVS, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
        rows: affectedRows,
        msg: `${affectedRows} rows updated into ${Tables.USER_FAVS} table`
    };
  }

  static async deleteOneById(id) {
    const statement = { 
      text: `delete from ${Tables.USER_FAVS} where id = ?`, 
      values: [id] ,
      operation: Operations.DELETE 
    };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
        rows: affectedRows,
        msg: `${affectedRows} rows deleted from ${Tables.USER_FAVS} table`
    };
  }
}

module.exports = FavouritesModel;
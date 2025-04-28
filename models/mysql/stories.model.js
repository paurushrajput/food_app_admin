const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, UnknownUser, Status } = require("../../constants/database");
const {isEmptyField} = require("../../utils/common");

class StoriesModel {
  static async list(body) {
    const {sort, limit, offset, keyword, is_paginated, from_date, to_date, id, type, status} = body;

    let condition = `WHERE st.deleted_at IS NULL`;
    const values = [];
    const countValues = [];

    // let pagination = `ORDER BY st.${sort} LIMIT ${offset}, ${limit}`;
    let pagination = `ORDER BY st.sequence asc LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY st.sequence asc`;
    }

    if(!isEmptyField(keyword)){
      condition += ` AND (st.title LIKE ?)`
      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }
    if(!isEmptyField(from_date)){
      condition += ` AND DATE_FORMAT(st.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }
    if(!isEmptyField(to_date)){
      condition += ` AND DATE_FORMAT(st.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }
    if(!isEmptyField(id)){
      condition += ` and st.uid = ?`
      values.push(id);
      countValues.push(id);
    }
    if(!isEmptyField(type)){
      condition += ` and st.type = ?`
      values.push(type);
      countValues.push(type);
    }
    if (!isEmptyField(status)) {
      condition += ` AND (st.status = ?)`
      values.push(status);
      countValues.push(status);
    }

    const statement = {
      text: `SELECT 
        st.uid as id, 
        st.title,
        st.duration, 
        st.type,
        st.action,
        st.status, 
        st.created_at, 
        st.deleted_at,
        st.sequence,
        COALESCE(CONCAT(m.basePath,'/',m.filename),'') as image
        FROM ${Tables.STORIES} st left join ${Tables.MEDIA} m on st.image_id = m.id ${condition} ${pagination};`,
      values: values,
      rowsOnly: true,
    }

    const countText = `SELECT count(st.id) as count FROM ${Tables.STORIES} st ${condition};`;

    const countStatement = {
      text: countText,
      values: countValues,
      rowsOnly: true,
    }

    const listPr = db.query(statement);
    const countPr = db.query(countStatement);

    const promiseData = await Promise.all([listPr, countPr]);

    return {
      count: promiseData[1]?.rows[0]?.count || 0,
      rows: promiseData[0]?.rows || [],
    }
  }

  static async insert(data) {
      const statement = { ...insertData(Tables.STORIES, data), operation: Operations.INSERT };
      const result = await db.query(statement);
      const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
      return {
          rows: affectedRows,
          msg: `${affectedRows} rows inserted into ${Tables.STORIES} table`
      };
  }

  static async updateOneById(columns, id) {
      const statement = { ...updateSingle(Tables.STORIES, columns, id), operation: Operations.UPDATE };
      const result = await db.query(statement);
      const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
      return {
          rows: affectedRows,
          msg: `${affectedRows} rows updated into ${Tables.STORIES} table`
      };
  }

  static async getOneByColumn(body) {
      const {column = 'id', value = ""} = body;
  
      let text = `SELECT id, uid, status, country_code, mobile, email from ${Tables.STORIES} WHERE ${column} = ? AND deleted_at IS NULL;`
  
      const statement = {
        text,
        values: [value],
        rowsOnly: true,
      }
  
      const result = await db.query(statement);
  
      return result.rows;
  };

  static async getOneByColumns(body) {
    const {columns = ['id'], values = [""], condition = "AND"} = body;
    let columnsString = ``
    columns.map(el=> {
      columnsString += `${el} = ? ${condition} `
    })

    const columnsStringLastIndex = columnsString.trim().lastIndexOf(condition);
    columnsString = columnsString.substr(0, columnsStringLastIndex);

    let text = `SELECT id, uid, status, image_id, title from ${Tables.STORIES} WHERE ${columnsString} AND deleted_at IS NULL;`

    const statement = {
      text,
      values: [...values],
      rowsOnly: true,
    }

    const result = await db.query(statement);

    return result.rows;

     // const [client] = await ClientsModel.getOneByColumns({
    //   columns: ["id", "country_id"],
    //   values: [city_id, country?.id],
    //   // condition: "AND"  //optional, by default AND
    // });
  };

  static async getOneByColumnsByInQuery(body) {
    const {columns = ['id'], values = [""], condition = "AND"} = body;
    let columnsString = ``
    columns.map((el, index)=> {
      columnsString += `${el} IN (${inMapper(values[index])}) ${condition} `
    })

    const columnsStringLastIndex = columnsString.trim().lastIndexOf(condition);
    columnsString = columnsString.substr(0, columnsStringLastIndex);

    let text = `SELECT id, uid, status, client_id, game_id from ${Tables.STORIES} WHERE ${columnsString} AND deleted_at IS NULL;`

    const statement = {
      text,
      values: [...values],
      rowsOnly: true,
    }

    const result = await db.query(statement);

    return result.rows;

		// const gameIds = games.map(el=>(String(el.game_id)))
    // const clientGames = await ClientsModel.getOneByColumnsByInQuery({
    //   columns: ["game_id", "client_id"],
    //   values: [gameIds, [1]],
    // });
  };

  static async findMaxSequence() {
    const statement = {
        text: `SELECT COALESCE(max(sequence), 0) AS sequence FROM ${Tables.STORIES} where deleted_at IS NULL;`,
        values: [],
    }
    const result = await db.query(statement);
    return result.rows
}
}

module.exports = StoriesModel;
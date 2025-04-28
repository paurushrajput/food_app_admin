const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Bit, Status, UserStatus } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common.js");

class DeletedUsers {
  static async list(body) {
    const {sort, limit, offset, keyword, is_paginated, from_date, to_date, id} = body;
    // let condition = `WHERE st.deleted_at IS NULL`;
    let condition = `WHERE u.status = ? /*AND du.user_email IS NOT NULL*/`;
    const values = [UserStatus.deleted];
    const countValues = [UserStatus.deleted];

    let pagination = ``;
    if(!isEmptyField(keyword)){
       pagination = `ORDER BY u.${sort}`;
    }else{
       pagination = `ORDER BY u.${sort} limit ${offset}, ${limit}`;
    }
    if (!is_paginated) {
      pagination = `ORDER BY u.${sort}`;
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
      condition += ` and u.uid = ?`
      values.push(id);
      countValues.push(id);
    }
    // if(!isEmptyField(type)){
    //   condition += ` and st.type = ?`
    //   values.push(type);
    //   countValues.push(type);
    // }

    const statement = {
      text: `SELECT 
        du.uid as id,
        u.id as user_id,
        du.user_email,
        du.country_code,
        du.mobile,
        du.user_details, 
        du.status,
        du.created_at
        FROM ${Tables.USERS} u 
        INNER JOIN (
          SELECT 
            *, 
            ROW_NUMBER() OVER (PARTITION BY du1.user_email, du1.mobile ORDER BY du1.id DESC) AS rank_no
          FROM 
          ${Tables.DELETED_USERS} du1
        )
        du ON du.user_id = u.id AND du.rank_no = ? AND du.status = ?
        ${condition} ${pagination};`,
      values: [Bit.one, Status.one, ...values],
      rowsOnly: true,
    }

    const countText = `SELECT count(u.id) as count FROM ${Tables.USERS} u 
      INNER JOIN (
        SELECT 
          *, 
          ROW_NUMBER() OVER (PARTITION BY du1.user_email ORDER BY du1.id DESC) AS rank_no
        FROM 
        ${Tables.DELETED_USERS} du1
      )
      du ON du.user_id = u.id AND du.rank_no = ? AND du.status = ? ${condition}`;

    const countStatement = {
      text: countText,
      values: [Bit.one, Status.one, ...countValues],
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

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.DELETED_USERS, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
        rows: affectedRows,
        msg: `${affectedRows} rows updated into ${Tables.DELETED_USERS} table`
    };
  }

  static async getOneByColumns(body) {
    const { columns = ["id"], values = [""] } = body;
    let columnsString = ``;
    columns.map((el) => {
      columnsString += `${el} = ? AND `;
    });

    const columnsStringLastIndex = columnsString.trim().lastIndexOf("AND");
    columnsString = columnsString.substr(0, columnsStringLastIndex);

    let text = `SELECT id, uid, status from ${Tables.DELETED_USERS} WHERE ${columnsString};`;

    const statement = {
      text,
      values: [...values],
      rowsOnly: true,
    };

    const result = await db.query(statement);

    return result.rows;
  }

  static async getAllByColumnsByInQuery(body, transaction = null) {
    const {columns = ['id'], values = [""]} = body;
    let columnsString = ``
    columns.map((el, index)=> {
      columnsString += `${el} IN (${inMapper(values[index])}) AND `
    })

    const columnsStringLastIndex = columnsString.trim().lastIndexOf('AND');
    columnsString = columnsString.substr(0, columnsStringLastIndex);

    let text = `SELECT du.id, du.uid, usr.uid AS user_id, du.user_email,
    du.user_details, usr.mobile 
    FROM ${Tables.DELETED_USERS} du
    LEFT JOIN ${Tables.USERS} usr ON usr.id = du.user_id
    WHERE ${columnsString};`

    const statement = {
      text,
      values: [...values],
      rowsOnly: true,
      transaction
    }

    const result = await db.query(statement);

    return result.rows;
  };
}

module.exports = DeletedUsers;
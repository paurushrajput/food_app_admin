const {
  db,
  inMapper,
  insertData,
  updateSingle,
} = require("../../dbConfig/dbConnect");
const { Tables, Operations, Status, Bit } = require("../../constants/database");
const {isEmptyField} = require("../../utils/common.js");
const {BannerSize} = require("../../constants/banner.js");


class BannerModel {
	static async list(body) {
    const {sort, limit, offset, keyword, is_paginated, from_date, to_date, id, type, size} = body;

    let condition = `WHERE bn.deleted_at IS NULL`;
    const values = [];
    const countValues = [];

    let pagination = `ORDER BY bn.${sort} limit ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY bn.${sort}`;
    }

    if(!isEmptyField(keyword)){
      condition += ` AND (bn.action_screen LIKE ? OR bn.screen_type LIKE ? )`
      values.push(`%${keyword}%`);
      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }

    if(!isEmptyField(from_date)){
      condition += ` AND DATE_FORMAT(bn.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }
    if(!isEmptyField(to_date)){
      condition += ` AND DATE_FORMAT(bn.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }
    if(!isEmptyField(id)){
      condition += ` and bn.uid = ?`
      values.push(id);
      countValues.push(id);
    }
    if(!isEmptyField(type)){
      condition += ` and bn.banner_type = ?`
      values.push(type);
      countValues.push(type);
    }
    if(!isEmptyField(size)){
      condition += ` and bn.banner_size = ?`
      values.push(BannerSize[size]);
      countValues.push(BannerSize[size]);
    }

    const statement = {
      text: `SELECT 
        bn.uid as id, 
        bn.banner_type, 
        bn.banner_size, 
        bn.screen_type,
        bn.action_screen,
        bn.action,
        bn.status, 
        bn.start_time, 
        bn.end_time, 
        bn.created_at, 
        bn.deleted_at,
        t.uid as tournament_id,
        t.game_id as game_id,
        r.uid as restaurant_id,
        r.name as res_name,
        t.other_details,
        COALESCE(CONCAT(m.basePath,'/',m.filename),'') as banner_url
        FROM ${Tables.BANNER} bn 
        LEFT JOIN ${Tables.MEDIA} m ON bn.banner_url = m.id
        LEFT JOIN ${Tables.TOURNAMENTS} t ON bn.tournament_id = t.id 
        LEFT JOIN ${Tables.RESTAURANTS} r ON bn.res_id = r.id 
        ${condition} ${pagination};`,
      values: values,
      rowsOnly: true,
    }

    const countText = `SELECT count(bn.id) as count FROM ${Tables.BANNER} bn ${condition};`;

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

	static async insert(banner) {
    const statement = {
      ...insertData(Tables.BANNER, banner),
      operation: Operations.INSERT,
    };
    const result = await db.query(statement);
    const affectedRows = Number(
      JSON.parse(JSON.stringify(result))?.rows?.affectedRows
    );
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.BANNER} table`,
    };
  }

  static async updateOneById(columns, id) {
    const statement = {
      ...updateSingle(Tables.BANNER, columns, id),
      operation: Operations.UPDATE,
    };
    const result = await db.query(statement);
    const affectedRows = Number(
      JSON.parse(JSON.stringify(result))?.rows?.affectedRows
    );
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.BANNER} table`,
    };
  }

  static async getOneByuId(uid) {
    const statement = {
      text: `SELECT id , banner_url ,app_type, action FROM ${Tables.BANNER} where uid = ?;`,
      values: [uid],
    };
    const result = await db.query(statement);
    return result.rows;
  }

  static async getBannerList(body) {
    const {
      type,
      source,
      banner_size,
      sort_by,
      offset,
      limit,
      keyword,
      is_paginated,
      sort,
      from_date,
      to_date,
    } = body;
    const columns = `b.uid, b.id, b.banner_size, b.status, b.banner_type, b.banner_url, b.campaign_id, b.created_by, b.updated_by, b.app_type, b.timestamp, b.created_at, b.action, b.banner_order, b.message, CONCAT(m.basePath,'/',m.filename) as filename , b.action_type`;

    let condition = `WHERE b.status = ${Status.one}`;
    const joinClause = `INNER JOIN ${Tables.MEDIA} m ON b.banner_url = m.id`;

    let pagination = `ORDER BY b.${sort} LIMIT ${offset}, ${limit}`;

    const values = [];
    const countValues = [];

    if (type) {
      condition += ` AND b.banner_type = ?`;
      values.push(type);
      countValues.push(type);
    }

    if (source) {
      condition += ` AND b.app_type = ?`;
      values.push(source);
      countValues.push(source);
    }

    if (banner_size) {
      condition += ` AND b.banner_size = ?`;
      values.push(banner_size);
      countValues.push(banner_size);
    }

    if (
      !is_paginated ||
      is_paginated === "" ||
      is_paginated.toString() === "false"
    ) {
      pagination = ``;
    }

    if (keyword && keyword !== "") {
      condition += ` AND b.banner_url LIKE ?`;
      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }

    if (from_date && from_date !== "") {
      condition += ` AND DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i:%s') >= ?`;
      values.push(from_date);
      countValues.push(from_date);
    }

    if (to_date && to_date !== "") {
      condition += ` AND DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i:%s') <= ?`;
      values.push(to_date);
      countValues.push(to_date);
    }

    const query = `
            SELECT ${columns}
            FROM ${Tables.BANNER} b
            ${joinClause}
            ${condition}
            ${pagination}
        `;

    const countQuery = `
            SELECT COUNT(b.id) as count
            FROM ${Tables.BANNER} b
            ${joinClause}
            ${condition}
        `;

    const statement = {
      text: query,
      values,
      rowsOnly: true,
    };

    const countStatement = {
      text: countQuery,
      values: countValues,
      rowsOnly: true,
    };

    const listPr = db.query(statement);
    const countPr = db.query(countStatement);

    const [listResult, countResult] = await Promise.all([listPr, countPr]);
    return {
      count: countResult.rows[0].count,
      rows: listResult.rows,
    };
  }

  static async getBannerByappType(
    app_type,
    size = "small",
    banner_type = "all"
  ) {
    const statement = {
      text: `SELECT banner_url , action , id , timestamp, banner_type, app_type, banner_size, action_screen, banner_order , message FROM ${Tables.BANNER} WHERE app_type = ? AND status = ${Bit.one} AND banner_type = ? AND banner_size = ?`,
      values: [app_type, banner_type, size],
    };
    const result = await db.query(statement);
    return result.rows;
  }

  static async getOneByColumns(body) {
    const { columns = ["id"], values = [""] } = body;
    let columnsString = ``;
    columns.map((el) => {
      columnsString += `${el} = ? AND `;
    });

    const columnsStringLastIndex = columnsString.trim().lastIndexOf("AND");
    columnsString = columnsString.substr(0, columnsStringLastIndex);

    let text = `SELECT id, uid, status from ${Tables.BANNER} WHERE ${columnsString} AND deleted_at IS NULL;`;

    const statement = {
      text,
      values: [...values],
      rowsOnly: true,
    };

    const result = await db.query(statement);

    return result.rows;
  }

  static async onlyExpiredBanners() {
    let condition = ` WHERE deleted_at IS NULL AND status = ${Bit.one}
    AND end_time <=  UNIX_TIMESTAMP(NOW()) `
    const text = `SELECT 
        id,uid,start_time,end_time,status ,banner_type,
        FROM_UNIXTIME(start_time) as formatted_start_time ,
        FROM_UNIXTIME(end_time) as formatted_end_time 
        FROM ${Tables.BANNER} 
        ${condition} ;`

    const statement = {
      text,
      values: [],
      rowsOnly: true,
    };

    const countText = `SELECT 
        COUNT(*) as count 
        FROM ${Tables.BANNER} 
        ${condition} ;`


    const countStatement = {
      text:countText,
      values: [],
      rowsOnly: true,
    };

    const result1 =  db.query(statement);
    const result2 =  db.query(countStatement);
    const promiseResult = await Promise.all([result1,result2])
    return {
        rows:promiseResult[0].rows,
        count:promiseResult[1].rows[0].count
    } 

  }

  static async updateExpiredBanners(ids) {
    let condition = ` WHERE id IN (${inMapper(ids)}) `
    const text = `UPDATE ${Tables.BANNER}
        SET status = ${Bit.zero}
        ${condition} ;`

    const statement = {
      text,
      values: [],
      rowsOnly: true,
    };

    const result1 = await db.query(statement);
    return {
      affectedRows:result1.rows.affectedRows
    } 

  }
}

module.exports = BannerModel;

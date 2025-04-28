const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, UnknownUser, Status } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");
const { TournamentStatus } = require("../../constants/tournaments.js");


class TournamentsModel {
  static async list(body) {
    const { sort, limit, offset, keyword, is_paginated, from_date, to_date, id, status } = body;

    // let condition = `WHERE ct.status = ? and ct.deleted_at IS NULL`;
    let condition = `WHERE ct.deleted_at IS NULL`;
    const values = [];
    const countValues = [];

    let pagination = `ORDER BY ct.${sort} limit ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY ct.${sort}`;
    }

    if (!isEmptyField(keyword)) {
      // condition += ` AND (ct.name LIKE ? OR ct.email LIKE ?)`
      // values.push(`%${keyword}%`,`%${keyword}%`);
      // countValues.push(`%${keyword}%`,`%${keyword}%`);
    }
    if (!isEmptyField(from_date)) {
      condition += ` AND DATE_FORMAT(ct.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }
    if (!isEmptyField(to_date)) {
      condition += ` AND DATE_FORMAT(ct.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }
    if (!isEmptyField(id)) {
      condition += ` and ct.uid = ?`
      values.push(id);
      countValues.push(id);
    }
    if (!isEmptyField(status)) {
      condition += ` AND (ct.status = ?)`
      values.push(status);
      countValues.push(status);
    }

    const statement = {
      text: `SELECT 
        ct.uid as id, 
        ct.title,
        ct.game_id, 
        ct.date_start, 
        ct.date_end, 
        ct.reward_type,
        ct.min_user,
        ct.max_user,
        ct.entry_fee,
        ct.total_winning_amount,
        CAST(ct.winning_distribution AS SIGNED) as winning_distribution,
        ct.entry_type,
        ct.type,
        ct.user_referral_points,
        ct.game_id,
        ct.other_details,
        ct.status, 
        wb.uid as winner_breakup_id,
        tr.uid as tournament_rule_id,
        ct.created_at, 
        ct.deleted_at,
        COALESCE(CONCAT(m.basePath,'/',m.filename),'') as image
        FROM ${Tables.TOURNAMENTS} ct join ${Tables.WINNER_BREAKUP} wb on ct.winner_breakup_id = wb.id join ${Tables.TOURNAMENT_RULES} tr on ct.tournament_rule_id = tr.id left join ${Tables.MEDIA} m on ct.image = m.id ${condition} ${pagination};`,
      values: values,
      rowsOnly: true,
    }

    const countText = `SELECT count(ct.id) as count FROM ${Tables.TOURNAMENTS} ct ${condition};`;

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

  static async insert(data) {
    const statement = { ...insertData(Tables.TOURNAMENTS, data), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.TOURNAMENTS} table`
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.TOURNAMENTS, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.TOURNAMENTS} table`
    };
  }

  static async getOneByColumn(body) {
    const { column = 'id', value = "" } = body;

    let text = `SELECT id, uid, status, country_code, mobile, email from ${Tables.TOURNAMENTS} WHERE ${column} = ? AND deleted_at IS NULL;`

    const statement = {
      text,
      values: [value],
      rowsOnly: true,
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

    let text = `SELECT id, uid, status, game_id, other_details from ${Tables.TOURNAMENTS} WHERE ${columnsString} AND deleted_at IS NULL;`

    const statement = {
      text,
      values: [...values],
      rowsOnly: true,
    }

    const result = await db.query(statement);

    return result.rows;
  };

  static async isTournamentExist(body) {
    const { columns = ['id'], values = [""] } = body;
    let columnsString = ``
    columns.map(el => {
      columnsString += `${el} = ? AND `
    })

    const columnsStringLastIndex = columnsString.trim().lastIndexOf('AND');
    columnsString = columnsString.substr(0, columnsStringLastIndex);

    let text = `SELECT id, uid, status, game_id from ${Tables.TOURNAMENTS} WHERE ${columnsString} AND status NOT IN (${TournamentStatus.completed}, ${TournamentStatus.abandoned}) AND deleted_at IS NULL;`

    const statement = {
      text,
      values: [...values],
      rowsOnly: true,
    }

    const result = await db.query(statement);

    return result.rows;
  };

  static async getActiveTournaments() {
    const statement = {
      text: `SELECT id, title, date_start, date_end, status FROM ${Tables.TOURNAMENTS} WHERE status NOT IN (${TournamentStatus.completed}, ${TournamentStatus.abandoned}) AND deleted_at IS NULL;`,
      values: [],
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async getScheduledTournaments() {
    const statement = {
      text: `SELECT id, title, date_start, date_end, status FROM ${Tables.TOURNAMENTS} WHERE status = ${TournamentStatus.scheduled} AND deleted_at IS NULL;`,
      values: [],
    }
    const result = await db.query(statement);
    return result.rows;
  }

  static async getLiveTournamentDetails(transaction) {
    const statement = {
      text: `SELECT
        t.id, 
        t.uid, 
        t.title, 
        t.game_id 
      FROM ${Tables.TOURNAMENTS} t 
      WHERE NOW() BETWEEN FROM_UNIXTIME(t.date_start) AND FROM_UNIXTIME(t.date_end) AND t.status = ${TournamentStatus.live} AND t.deleted_at IS NULL ORDER BY id desc limit 1;`,
      values: [],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async getCompletedTournamentDetails(transaction) {
    const statement = {
      text: `SELECT 
        t.id,
        t.uid, 
        t.title, 
        t.game_id 
      FROM ${Tables.TOURNAMENTS} t 
      WHERE NOW() >= FROM_UNIXTIME(t.date_end) AND t.status = ${TournamentStatus.completed} AND t.deleted_at IS NULL ORDER BY id desc limit 1;`,
      values: [],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async getLiveTournaments(data) {
    let { game_id } = data
    let conditions = ` WHERE game_id = ? AND status = ${TournamentStatus.live} AND deleted_at IS NULL `
    const statement = {
      text: `SELECT count(*) as count FROM ${Tables.TOURNAMENTS} ${conditions} ;`,
      values: [game_id]
    }
    const result = await db.query(statement);
    return result.rows;
  }

}

module.exports = TournamentsModel;
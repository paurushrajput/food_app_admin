const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, UserStatus, Bit } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");

class TournamentManifestModel {

  static async insert(tournamentManifest) {
    const statement = { ...insertData(Tables.TOURNAMENT_MANIFEST, tournamentManifest), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.TOURNAMENT_MANIFEST} table`
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.TOURNAMENT_MANIFEST, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.TOURNAMENT_MANIFEST} table`
    };
  }

  static async findByTournamentId(tournament_id, systemUserIds = []) {
    let condition = '';
    if (systemUserIds && systemUserIds.length > 0) {
      condition = ` AND tm.user_id NOT IN (${inMapper(systemUserIds)}) AND u.is_nukhba_user = ${Bit.zero}`
    }
    const statement = {
      text: `SELECT tm.id, tm.tournament_id, tm.user_id, tm.total_score, tm.referral_user_details FROM ${Tables.TOURNAMENT_MANIFEST} tm LEFT JOIN ${Tables.USERS} u on tm.user_id = u.id where tm.tournament_id = ? and deleted_at is null AND u.status <> ? ${condition};`,
      values: [tournament_id, UserStatus.deleted],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findOneByUserIdAndTournamentId(user_id, tournament_id) {
    const statement = {
      text: `SELECT id, uid, tournament_id, user_id, total_score, user_rank, winning_amount, total_reward_points, user_game_details, referral_user_details, status FROM ${Tables.TOURNAMENT_MANIFEST} where user_id = ? AND tournament_id = ? and deleted_at is null;`,
      values: [user_id, tournament_id,],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findOneByuId(uid) {
    const statement = {
      text: `SELECT id, uid, tournament_id, user_id, total_score, user_rank, winning_amount, total_reward_points, user_game_details, referral_user_details, status FROM ${Tables.TOURNAMENT_MANIFEST} where uid = ? and deleted_at is null ;`,
      values: [uid],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findOneById(id) {
    const statement = {
      text: `SELECT id, uid, tournament_id, user_id, total_score, user_rank, winning_amount, total_reward_points, user_game_details, referral_user_details, status FROM ${Tables.TOURNAMENT_MANIFEST} where id = ? and deleted_at is null;`,
      values: [id],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async listTournamentManifestList(body) {
    const { sort, offset, limit, is_paginated, tournament, user_data } = body;
    const columns = ` tm.uid as id, tm.tournament_id, tm.user_id, tm.total_score, tm.user_rank, tm.winning_amount, tm.total_reward_points, tm.user_game_details, tm.referral_user_details, tm.status `
    let condition = ` tm.deleted_at is NULL `;
    let pagination = `order by ${sort} limit ${offset} , ${limit}`;

    const values = [];
    const countValues = [];

    if (!is_paginated || is_paginated.toString() === 'false') {
      pagination = ``;
    }

    if (tournament && tournament !== "") {
      condition += ` AND (LOWER(t.title) like LOWER(?))`
      values.push(`%${tournament}%`);
      countValues.push(`%${tournament}%`);
    }

    if (user_data && user_data !== "") {
      condition += ` AND (LOWER(u.first_name) LIKE LOWER(?) or LOWER(u.last_name) LIKE LOWER(?) or LOWER(u.email) LIKE LOWER(?))`
      values.push(`%${user_data}%`);
      values.push(`%${user_data}%`);
      values.push(`%${user_data}%`);
      countValues.push(`%${user_data}%`);
      countValues.push(`%${user_data}%`);
      countValues.push(`%${user_data}%`);
    }

    const text = `SELECT ${columns} FROM ${Tables.TOURNAMENT_MANIFEST} tm join ${Tables.TOURNAMENTS} t on tm.tournament_id = t.id join ${Tables.USERS} u on tm.user_id = u.id WHERE ${condition} ${pagination}`;
    const countText = `SELECT Count(tm.id) as count from ${Tables.TOURNAMENT_MANIFEST} tm join ${Tables.TOURNAMENTS} t on tm.tournament_id = t.id join ${Tables.USERS} u on tm.user_id = u.id WHERE ${condition}`;

    const statement = {
      text,
      values,
      rowsOnly: true
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
  }

  static async getTournamentManifestByTournamentId(body) {
    const { sort, offset, limit, is_paginated, tournament_id, systemUserIds = [], keyword, rank_from, rank_to } = body;
    const columns = ` u.uid as user_id, tm.total_score, tm.referral_user_details, tm.user_rank, CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,'')) AS username, concat(m.basePath,'/',m.filename) as profile_pic`
    let condition = ` tm.deleted_at is NULL AND tm.user_rank IS NOT NULL AND u.status <> ${UserStatus.deleted}`;
    let pagination = `order by ${sort} limit ${offset} , ${limit}`;

    if (systemUserIds.length > 0) {
      if (condition != "") {
        condition += " AND "
      }
      condition += ` tm.user_id NOT IN (${inMapper(systemUserIds)}) AND u.is_nukhba_user = ${Bit.zero}`
    }

    const values = [];
    const countValues = [];

    if (!is_paginated || is_paginated.toString() === 'false') {
      pagination = ``;
    }

    condition += ` AND t.id = ? `
    values.push(tournament_id);
    countValues.push(tournament_id);

    if (!isEmptyField(keyword)) {
      condition += ` AND  ( 
        LOWER(CONCAT(u.first_name,' ',u.last_name)) LIKE LOWER(?) OR
        LOWER(u.first_name) LIKE LOWER(?) OR 
        LOWER(u.last_name) LIKE LOWER(?)
      )`
      values.push(`%${keyword}%`,`%${keyword}%`, `%${keyword}%`);
      countValues.push(`%${keyword}%`,`%${keyword}%`, `%${keyword}%`);
    }

    if (!isEmptyField(rank_from)) {
      condition += ` AND tm.user_rank >= ?`
      values.push(rank_from);
      countValues.push(rank_from);
    }
    if (!isEmptyField(rank_to)) {
      condition += ` AND tm.user_rank <= ?`
      values.push(rank_to);
      countValues.push(rank_to);
    }

    const text = `SELECT ${columns} FROM ${Tables.TOURNAMENT_MANIFEST} tm join ${Tables.TOURNAMENTS} t on tm.tournament_id = t.id join ${Tables.USERS} u on tm.user_id = u.id left join ${Tables.MEDIA} m on u.profile_pic_id = m.id WHERE ${condition} ${pagination}`;
    const countText = `SELECT Count(tm.id) as count from ${Tables.TOURNAMENT_MANIFEST} tm join ${Tables.TOURNAMENTS} t on tm.tournament_id = t.id join ${Tables.USERS} u on tm.user_id = u.id left join ${Tables.MEDIA} m on u.profile_pic_id = m.id WHERE ${condition}`;

    const statement = {
      text,
      values,
      rowsOnly: true
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
  }

}

module.exports = TournamentManifestModel;
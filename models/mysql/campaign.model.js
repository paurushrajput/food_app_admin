const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Status, Bit, USER_TYPE, BookingTrackStatus } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");

class CampaignModel {

  static async insert(campaign) {
    const statement = { ...insertData(Tables.CAMPAIGN, campaign), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.CAMPAIGN} table`
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.CAMPAIGN, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.CAMPAIGN} table`
    };
  }

  static async findOneByuId(uid, transaction) {
    const statement = {
      text: `SELECT id, uid, title, start_date, end_date, commission_type, commission_amount, agent_id, coupon_id, action, status FROM ${Tables.CAMPAIGN} WHERE uid = ? and deleted_at IS NULL;`,
      values: [uid],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findOneById(id) {
    const statement = {
      text: `SELECT id, uid, title, start_date, end_date, commission_type, commission_amount, agent_id, coupon_id, action FROM ${Tables.CAMPAIGN} where id = ? and deleted_at is null ;`,
      values: [id],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async list(body) {
    const { sort, limit, offset, is_paginated, keyword, from_date, to_date, id, status, is_expired } = body;

    let condition = `WHERE c.status = ${Status.one} and c.deleted_at IS NULL`;
    const values = [];
    const countValues = [];

    let pagination = `ORDER BY c.${sort} LIMIT ${offset}, ${limit}`;
    if (!is_paginated) {
      pagination = `ORDER BY c.${sort}`;
    }

    if (!isEmptyField(keyword)) {
      condition += ` AND c.title LIKE ?`
      values.push(`%${keyword}%`);
      countValues.push(`%${keyword}%`);
    }
    if (!isEmptyField(from_date)) {
      condition += ` AND DATE_FORMAT(c.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(from_date);
      countValues.push(from_date);
    }
    if (!isEmptyField(to_date)) {
      condition += ` AND DATE_FORMAT(c.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(to_date);
      countValues.push(to_date);
    }
    if (!isEmptyField(id)) {
      condition += ` and c.uid = ?`
      values.push(id);
      countValues.push(id);
    }
    if (!isEmptyField(status)) {
      condition += ` AND (c.status = ?)`
      values.push(status);
      countValues.push(status);
    }
    if (!isEmptyField(is_expired)) {
      if (is_expired == Bit.zero) {
        condition += ` AND c.start_date <= UNIX_TIMESTAMP() AND c.end_date >= UNIX_TIMESTAMP()`
      } else {
        condition += ` AND c.end_date < UNIX_TIMESTAMP()`
      }
    }

    // if (start_date && start_date !== "") {
    //   condition += ` AND  >= ?`
    //   values.push(start_date);
    //   countValues.push(start_date);
    // }
    // if (end_date && end_date !== "") {
    //   condition += ` AND c.end_date <= ?`
    //   values.push(end_date);
    //   countValues.push(end_date);
    // }

    const text = `SELECT 
      c.uid AS id, 
      c.title, 
      FROM_UNIXTIME(c.start_date) as start_date, 
      FROM_UNIXTIME(c.end_date) as end_date, 
      c.commission_type, 
      c.commission_amount, 
      u.uid AS agent_id, 
      CONCAT(COALESCE(u.first_name, ""), CASE WHEN NULLIF(u.first_name,"") IS NULL THEN "" WHEN NULLIF(u.last_name,"") IS NULL THEN "" ELSE " " END, COALESCE(u.last_name, "")) AS agent_name, 
      cpn.uid AS coupon_id, 
      cpn.coupon_code, 
      c.action,
      c.status,
      CASE
        WHEN c.start_date <= UNIX_TIMESTAMP() AND c.end_date >= UNIX_TIMESTAMP() THEN 'live'
        WHEN c.start_date > UNIX_TIMESTAMP() THEN 'scheduled'
        WHEN c.end_date < UNIX_TIMESTAMP() THEN 'completed'
        ELSE 'completed'
      END AS camp_status,
      c.created_at
    FROM ${Tables.CAMPAIGN} c 
    LEFT JOIN ${Tables.USERS} u ON c.agent_id = u.id 
    LEFT JOIN ${Tables.COUPONS} cpn ON c.coupon_id = cpn.id ${condition} ${pagination};`

    const countText = `SELECT COUNT(c.id) as count 
    FROM ${Tables.CAMPAIGN} c 
    LEFT JOIN ${Tables.USERS} u ON c.agent_id = u.id 
    LEFT JOIN ${Tables.COUPONS} cpn ON c.coupon_id = cpn.id ${condition}`;

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
      count: promiseData[1]?.rows[0]?.count || 0,
      rows: promiseData[0]?.rows || [],
    }
  };

  static async findRunningCampaignByColumn({ column = "id", value = null }, transaction) {
    if (isEmptyField(value))
      return [];

    const statement = {
      text: `SELECT id, uid, title, start_date, end_date, commission_type, commission_amount, agent_id, coupon_id, action FROM ${Tables.CAMPAIGN} WHERE ${column} = ? AND deleted_at IS NULL AND status = ${Status.one} AND UNIX_TIMESTAMP() BETWEEN start_date AND end_date;`,
      values: [value],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findRunningCouponCampaign({ couponId }, transaction) {
    if (isEmptyField(couponId))
      return [];

    const statement = {
      text: `SELECT 
            id, 
            uid, 
            title, 
            start_date, 
            end_date, 
            commission_type, 
            commission_amount, 
            agent_id, 
            coupon_id, 
            action 
            FROM ${Tables.CAMPAIGN} 
            WHERE coupon_id = ? AND agent_id IS NULL AND status = ${Status.one}
                AND deleted_at IS NULL 
                AND UNIX_TIMESTAMP() BETWEEN start_date AND end_date;`,
      values: [couponId],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async checkCampaignExistWithSameTitle({ title }, transaction) {
    if (isEmptyField(title))
      return [];

    const statement = {
      text: `SELECT 
            id, 
            uid, 
            title, 
            start_date, 
            end_date, 
            commission_type, 
            commission_amount, 
            agent_id, 
            coupon_id, 
            action 
            FROM ${Tables.CAMPAIGN} 
            WHERE title = ? AND deleted_at IS NULL;`,
      values: [title],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findRunningCampaignByAgent(agentId, action, transaction) {
    if (isEmptyField(agentId))
      return [];

    const statement = {
      text: `SELECT id, uid, title, start_date, end_date, commission_type, commission_amount, agent_id, coupon_id, action FROM ${Tables.CAMPAIGN} WHERE agent_id = ? AND deleted_at IS NULL AND status = ${Status.one} AND UNIX_TIMESTAMP() BETWEEN start_date AND end_date AND action = ?;`,
      values: [agentId, action],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async getCampaignData(campaignCode, start_date, end_date) {
    const usrIncompleteAdvPymtBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled];
    let condition = '';
    let orConditionUsers = [` u.user_type <> ${USER_TYPE.AGENT} `, ` u.is_pilot = ${Bit.zero} `, ` u.is_nukhba_user = ${Bit.zero} `]
    let orConditionReservations = [`r.status NOT IN (${usrIncompleteAdvPymtBookArr})`]
    const values = [];

    if (!isEmptyField(start_date)) {
      orConditionUsers.push(' u.created_at <= ? ');
      values.push(start_date);
      orConditionReservations.push(' r.created_at <= ? ');
      values.push(start_date);
    }

    if (!isEmptyField(end_date)) {
      orConditionUsers.push('  u.created_at >= ? ');
      values.push(end_date);
      orConditionReservations.push('  r.created_at >= ? ');
      values.push(end_date);
    }

    if (orConditionUsers.length > 0) {
      orConditionUsers = `AND (${orConditionUsers.join(' AND ')})`
    } else {
      orConditionUsers = '';
    }

    if (orConditionReservations.length > 0) {
      orConditionReservations = `AND (${orConditionReservations.join(' AND ')})`
    } else {
      orConditionReservations = '';
    }

    condition += ` camp.title = ? `;
    values.push(campaignCode);

    const statement = {
      text: `select camp.title as campaign_code, camp.start_date, camp.end_date, camp.commission_type, camp.commission_amount,
      camp.agent_id, cpn.coupon_code,
      (select count(r.id) from ${Tables.RESERVATIONS} r join coupon_redeem cr on r.coupon_redeem_id = cr.id WHERE cr.coupon_id = cpn.id ${orConditionReservations}) as total_booking,
      (select count(u.id) from ${Tables.USERS} u where u.campaign_id = camp.id ${orConditionUsers}) as total_signup
      from ${Tables.CAMPAIGN} camp left join ${Tables.COUPONS} cpn on camp.coupon_id = cpn.id where ${condition} `,
      values,
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findAgentCampaignReport(agentReferralCode) {
    const usrIncompleteAdvPymtBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled];
    const statement = {
      text: `SELECT 
    u.first_name AS agent_name,
    u.agent_username,
    u.referral_code AS agent_referral_code,
    (SELECT name FROM ${Tables.LOCATION} WHERE id = COALESCE(u.location_id, JSON_EXTRACT(u.actual_last_location, '$.location_id'))) AS location,
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'campaign_code', COALESCE(camp.title, 'N/A'),
            'campaign_start_date', COALESCE(camp.start_date, 'N/A'),
            'campaign_end_date', COALESCE(camp.end_date, 'N/A'),
            'coupon_code', COALESCE(cpn.coupon_code, 'N/A'),
            'mobile_verified_users_count', 
                (SELECT COUNT(*) FROM ${Tables.USERS} WHERE is_mobile_verified = ${Bit.one} AND referred_by = u.id AND user_type <> ${USER_TYPE.AGENT} AND is_pilot = ${Bit.zero} AND is_nukhba_user = ${Bit.zero}),
            'email_verified_users_count', 
                (SELECT COUNT(*) FROM ${Tables.USERS} WHERE is_email_verified = ${Bit.one} AND referred_by = u.id AND user_type <> ${USER_TYPE.AGENT} AND is_pilot = ${Bit.zero} AND is_nukhba_user = ${Bit.zero}),
            'total_users_count', 
                (SELECT COUNT(*) FROM ${Tables.USERS} WHERE referred_by = u.id AND user_type <> ${USER_TYPE.AGENT} AND is_pilot = ${Bit.zero} AND is_nukhba_user = ${Bit.zero}),
            'total_users_booking', 
                (SELECT COUNT(r.id) FROM ${Tables.RESERVATIONS} r JOIN ${Tables.USERS} u1 ON r.user_id = u1.id WHERE u1.referred_by = u.id AND r.status NOT IN (${usrIncompleteAdvPymtBookArr}))
        )
    ) AS details
    FROM 
        ${Tables.USERS} u 
    LEFT JOIN 
        ${Tables.CAMPAIGN} camp ON u.id = camp.agent_id 
    LEFT JOIN 
        ${Tables.COUPONS} cpn ON camp.coupon_id = cpn.id
    WHERE 
        (u.referral_code = ? OR ? IS NULL) 
        AND u.user_type = ${USER_TYPE.AGENT}
    GROUP BY u.first_name, u.agent_username, u.referral_code, u.location_id, u.actual_last_location;`,
      values: [agentReferralCode, agentReferralCode],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findCampaignUser(data) {
    const { 
        campaign_id,
        on_boarding_start, 
        on_boarding_end, 
        user_id,
        transaction } = data;

    const values = [campaign_id];
    let condition = `WHERE camp.id = ? AND u.status <> 0`;

    let joinCondition = `CASE 
            WHEN camp.agent_id IS NOT NULL THEN camp.agent_id = u.referred_by AND UNIX_TIMESTAMP(on_boarding_at) BETWEEN camp.start_date AND camp.end_date
            WHEN camp.coupon_id IS NOT NULL THEN camp.id = u.campaign_id
            ELSE 0
        END`
   
    if (!isEmptyField(on_boarding_start)) {
      condition += ` AND DATE_FORMAT(u.on_boarding_at,'%Y-%m-%d %H:%i:%s') >= ?`
      values.push(on_boarding_start);
    }
    
    if (!isEmptyField(on_boarding_end)) {
      condition += ` AND DATE_FORMAT(u.on_boarding_at,'%Y-%m-%d %H:%i:%s') <= ?`
      values.push(on_boarding_end);
    }

    if (!isEmptyField(user_id)) {
      condition += ` AND u.id = ?`
      values.push(user_id);
    }

    const statement = {
      text: `SELECT u.id as id 
        FROM ${Tables.CAMPAIGN} camp 
        INNER JOIN ${Tables.USERS} u ON ${joinCondition}
        ${condition}`,
      values,
      transaction
    }
    const result = await db.query(statement);
    return result.rows
}

}

module.exports = CampaignModel;
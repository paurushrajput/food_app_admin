const { db, inMapper, insertData, updateSingle, updateMultiple } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Bit, UserStatus, RowStatus, CancelledBookingStatus, BookingTrackStatus } = require("../../constants/database");
const { getKeyByValue } = require("../../utils/general");
const { isEmptyField } = require("../../utils/common");
const { DEFAULT_DASHBOARD_DATA_INTERVAL_DAYS } = require("../../constants/variables");
const ServerError = require("../../error/serverError");

class AgentModel {
    static async insert(users) {
        const statement = { ...insertData(Tables.USERS, users), operation: Operations.INSERT };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows inserted into ${Tables.USERS} table`
        };
    }

    static async updateOneById(columns, id) {
        const statement = { ...updateSingle(Tables.USERS, columns, id), operation: Operations.UPDATE };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows updated into ${Tables.USERS} table`
        };
    }

    static async findIdWithEmail(email) {
        const statement = {
            text: `select id, uid, device_id, status from ${Tables.USERS} where email = ?;`,
            values: [email],
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findIdWithAgentUsername(agent_username) {
        const statement = {
            text: `select id, uid, device_id, status from ${Tables.USERS} where agent_username = ?;`,
            values: [agent_username],
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findIdWithMobile(mobile, country_code) {
        const statement = {
            text: `select id, uid, device_id, status from ${Tables.USERS} where mobile = ? and country_code = ? ;`,
            values: [mobile, country_code],
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findUserWithSocialId(socialId) {
        const statement = {
            text: `select id, uid, device_id, status from ${Tables.USERS} where social_id = ?;`,
            values: [socialId],
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findUserWithMobile(country_code, mobile) {
        const statement = {
            text: `select id, uid, device_id, status from ${Tables.USERS} where country_code = ? and mobile = ?;`,
            values: [country_code, mobile],
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findUserWithUid(uid) {
        const statement = {
            text: `select id, uid,first_name, device_id, status, coordinates, user_type from ${Tables.USERS} where uid = ?;`,
            values: [uid],
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findUserWithDeviceId(device_id) {
        const statement = {
            text: `select id, uid, device_id, status from ${Tables.USERS} where device_id = ? and is_guest = ${Bit.one} order by id desc limit 1;`,
            values: [device_id],
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async updateUserLocation(body) {
        const { home_city_id, home_country_id, lat, lng, id } = body;

        let updateColunm = ``;
        if (home_city_id) {
            updateColunm = `home_city_id = ?, `
        }
        if (home_country_id) {
            updateColunm += `home_country_id = ?, `
        }
        updateColunm += `coordinates = POINT(?, ?)`
        const statement = {
            text: `UPDATE users SET ${updateColunm} WHERE id = ?`,
            values: [home_city_id, home_country_id, lat, lng, id],
            operation: Operations.UPDATE
        }

        const result = await db.query(statement);

        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows updated into ${Tables.USERS} table`
        };
    };

    static async getAgentsList(data){
        const { sort, offset, limit, is_paginated, user_type, search, status, is_pilot, from_date, to_date, booking_count, is_nukhba_user, campaign_title, user_invites_status, country_code } = data;
        let pagination = ` limit ${offset} , ${limit}`;

        let earnedCommisionSubquery = `  (
           SELECT SUM(ac2.commission_amount)
           FROM agent_commission ac2
           WHERE ac2.agent_id = u.id
               AND ac2.status = 1  
               AND ca.action = 1
       ) AS earned_commission_amount
        `

        const columns = ` u.uid as user_id ,u.agent_username as username, u.status as user_status, 
         COUNT(distinct referred.id) as referred_user_count , 
         CAST(u.is_mobile_verified AS SIGNED) as is_mobile_verified,
         CAST(u.is_email_verified AS SIGNED) as is_email_verified , ca.commission_amount,
          l.name as location_name,ca.start_date as compaign_start_date,
          ca.end_date as compaign_end_date,
         u.email, u.mobile,u.referral_code , u.first_name,u.last_name,
         u.country_code, ca.title as campaign_title, u.share_link, u.created_at,
         ${earnedCommisionSubquery}
         `

        let condition = ``
        const values = []
        condition += ` WHERE u.user_type = ${Bit.one}   `

        if(!isEmptyField(search)){
            condition += ` AND u.agent_username LIKE ? `
            values.push(`%${search}%`)
        }
        

        

        const query = `SELECT  ${columns}
            FROM ${Tables.USERS} u 
            LEFT JOIN ${Tables.USERS} referred ON referred.referred_by = u.id
            LEFT join ${Tables.CAMPAIGN} ca ON ca.agent_id = u.id
            LEFT join ${Tables.LOCATION} l ON u.location_id = l.id
            LEFT JOIN ${Tables.AGENT_COMMISSION} ac ON u.id = ac.agent_id
            ${condition} 
            GROUP BY u.id
            ORDER BY u.created_at DESC ${pagination};`

        const countQuery = `SELECT  count(*) as count
            FROM ${Tables.USERS} u 
            ${condition};`

        const statement = {
            text: query,
            values: values,
        }

        const countStatement = {
            text: countQuery,
            values: values,
        }

        const result1 =  db.query(statement);
        const result2 =  db.query(countStatement);
        const promiseResult = await Promise.all([result1,result2])
        return {
            list:promiseResult[0].rows,
            count:promiseResult[1].rows
        } 
    }

    static async getAllUserList(data) {
        const { user_type, keyword, status, is_pilot, from_date, to_date, booking_count, is_nukhba_user, campaign_title, user_invites_status, country_code } = data;
        const columns = `u.id, 
        u.uid, 
        u.status, 
        u.fcm_token
        `

        let condition = ` WHERE u.status != ?`;
        const values = [UserStatus.deleted];
        const countValues = [UserStatus.deleted];

        if (!isEmptyField(user_type)) {
            condition += ` AND (u.user_type = ?)`
            values.push(user_type);
            countValues.push(user_type);
        }
        if (!isEmptyField(keyword)) {
            condition += ` AND (u.email LIKE ? OR u.device_id LIKE ? OR u.on_boarding_at LIKE ? OR u.first_name LIKE  ? OR u.last_name LIKE ?)`;
            for (let i = 0; i < 5; i++) {
                values.push(`%${keyword}%`);
                countValues.push(`%${keyword}%`);
            }
        }
        if (!isEmptyField(status)) {
            condition += ` AND (u.status = ?)`
            values.push(status);
            countValues.push(status);
        }
        if (!isEmptyField(is_pilot)) {
            condition += ` AND (u.is_pilot = ?)`
            values.push(is_pilot);
            countValues.push(is_pilot);
        }
        if (!isEmptyField(from_date)) {
            condition += ` AND DATE_FORMAT(u.on_boarding_at,'%Y-%m-%d %H:%i:%s') >= ?`
            values.push(from_date);
            countValues.push(from_date);
        }
        if (!isEmptyField(to_date)) {
            condition += ` AND DATE_FORMAT(u.on_boarding_at,'%Y-%m-%d %H:%i:%s') <= ?`
            values.push(to_date);
            countValues.push(to_date);
        }
        if (!isEmptyField(is_nukhba_user)) {
            condition += ` AND is_nukhba_user = ?`
            values.push(is_nukhba_user);
            countValues.push(is_nukhba_user);
        }
        if(!isEmptyField(campaign_title)){
            let campaign_title_trimmed = campaign_title.trim()
            condition += ` AND c.title = ?`
            values.push(campaign_title_trimmed);
            countValues.push(campaign_title_trimmed);
        }
        if(!isEmptyField(user_invites_status)){
            condition += ` AND JSON_EXTRACT(u.other_details, '$.user_invites_status') = ?`
            values.push(Number(user_invites_status));
            countValues.push(Number(user_invites_status));
        }
        if(!isEmptyField(country_code)){
            condition += ` AND u.country_code like ?`
            values.push(`%${country_code}%`);
            countValues.push(`%${country_code}%`);
        }


        const text = `SELECT ${columns} 
            FROM ${Tables.USERS} u 
            LEFT JOIN ${Tables.CAMPAIGN} c ON u.campaign_id = c.id ${condition}`;

        const statement = {
            text,
            values,
            rowsOnly: true
        }

        const result = await db.query(statement);
        return result.rows || []
    }

    static async findUserWithLastSeen(lastSeen, deviceType, is_nukhba_user, is_pilot) {
        const statement = {
            text: `select distinct u.id as user from ${Tables.USERS} u join ${Tables.LOGINS} l on u.id = l.user_id where u.last_seen = ? and l.device_type = ? AND u.is_nukhba_user = '${is_nukhba_user}' AND is_pilot = '${is_pilot}';`,
            values: [lastSeen, deviceType],
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findIdWithEmailMultiple(email) {
        if (!Array.isArray(email)) {
            email = [email]
        }
        const statement = {
            text: `select id from ${Tables.USERS} where email IN (${inMapper(email)});`,
            values: [],
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findDailyReportWithDate(log_date, is_nukhba_user) {
        const statement = {
            text: `select * from ${Tables.DAILY_REPORT} where log_date = ? AND is_nukhba_user = '${is_nukhba_user}' ;`,
            values: [log_date],
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findAllDailyReport(from_date, to_date, is_nukhba_user) {
        let condition = `WHERE is_nukhba_user = '${is_nukhba_user}' `;
        let values = []

        if (!isEmptyField(from_date) && !isEmptyField(to_date)) {
            condition += ` AND DATE_FORMAT(log_date,'%Y-%m-%d %H:%i:%s') >= ? AND DATE_FORMAT(log_date,'%Y-%m-%d %H:%i:%s') <=  ? `;
            values.push(from_date, to_date)
        } else if (!isEmptyField(from_date)) {
            condition += ` AND DATE_FORMAT(log_date,'%Y-%m-%d %H:%i:%s') >= ?`;
            values.push(from_date)
        } else if (!isEmptyField(to_date)) {
            condition += ` AND log_date <= ?`;
            values.push(to_date)
        } else {
            condition += ` AND log_date >= CURDATE() - INTERVAL ${DEFAULT_DASHBOARD_DATA_INTERVAL_DAYS} DAY`;
        }

        condition += " ORDER BY log_date DESC"
        const statement = {
            text: `select daily_active_users_android, daily_active_users_id_android, daily_active_users_ios,daily_active_users_id_ios,total_revenue,total_bookings,total_confirmed_bookings,total_cancelled_bookings,total_noshow, total_diners,actual_diners,daily_signups,total_completed_bookings,other_details,log_date from ${Tables.DAILY_REPORT} ${condition};`,
            values: values,
        };
        const result = await db.query(statement);
        return result.rows;
    }

    static async DeleteDailyReportWithDate(log_date, is_nukhba_user) {
        const statement = {
            text: `DELETE FROM ${Tables.DAILY_REPORT} where log_date = ? AND is_nukhba_user = '${is_nukhba_user}' ;`,
            values: [log_date],
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async insertDailyReport(dailyReport) {
        const statement = {
            ...insertData(Tables.DAILY_REPORT, dailyReport),
            operation: Operations.INSERT,
        };
        const result = await db.query(statement);
        const affectedRows = Number(
            JSON.parse(JSON.stringify(result))?.rows?.affectedRows
        );
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows inserted into ${Tables.DAILY_REPORT} table`,
        };
    }

    static async findTodaySignups(currentDate, is_nukhba_user, is_pilot) {
        const statement= {
            text: `select count(*) as count, device_type from ${Tables.USERS} where DATE_FORMAT(on_boarding_at,'%Y-%m-%d %H:%i:%s') = ? AND is_nukhba_user = '${is_nukhba_user}' AND is_pilot = '${is_pilot}' AND status <> '${UserStatus.deleted}' group by device_type;`,
            values: [currentDate],
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async updateManyById(columns, ids) {
        const statement = { ...updateMultiple(Tables.USERS, columns, ids), operation: Operations.UPDATE };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows updated into ${Tables.USERS} table`
        };
    }

    static async findUserWithId(id) {
        const statement = {
            text: `select  uid,first_name,last_name,email, device_id,on_boarding_at,status from ${Tables.USERS} where id = ?;`,
            values: [id],
        }
        const result = await db.query(statement);
        return result.rows[0];
    }


    static async getUnusedCouponUserList(data) {
        const { 
            sort,
            limit,
            offset,
            keyword,
            is_paginated,
            from_date,
            to_date,
            status,
            is_pilot, 
            is_nukhba_user, 
            campaign_title, 
            user_invites_status, 
            country_code,
            user_type,
            coupon_id
        } = data;
        const columns = `u.uid as id, 
        u.first_name, 
        u.last_name, 
        u.email, 
        u.country_code,  
        u.mobile, 
        u.address,
        camp.title as campaign_title, 
        u.coordinates,
        UNIX_TIMESTAMP(u.last_seen) as last_seen, 
        UNIX_TIMESTAMP(u.last_login) as last_login, 
        CAST(u.is_guest AS SIGNED) as is_guest, 
        UNIX_TIMESTAMP(u.on_boarding_at) as on_boarding_at, 
        u.fcm_token, 
        CAST(u.is_nukhba_user AS SIGNED) AS is_nukhba_user, 
        CAST(u.is_pilot AS SIGNED) AS is_pilot,
        u.created_at,
        u.other_details,
        CASE
           WHEN u.status = ${UserStatus.active} THEN '${getKeyByValue(UserStatus, UserStatus.active)}'
           WHEN u.status = ${UserStatus.deleted} THEN '${getKeyByValue(UserStatus, UserStatus.deleted)}'
           WHEN u.status = ${UserStatus.blocked} THEN '${getKeyByValue(UserStatus, UserStatus.blocked)}'
           WHEN u.status = ${UserStatus.suspended} THEN '${getKeyByValue(UserStatus, UserStatus.suspended)}'
           WHEN u.status = ${UserStatus.noshow} THEN '${getKeyByValue(UserStatus, UserStatus.noshow)}'
           ELSE '${RowStatus.active}'
        END AS status
        `

        let condition = `WHERE u.status != ${UserStatus.deleted} AND cpn.uid = ? 
        AND CASE 
        WHEN cr.is_used = ${Bit.one}
        THEN rev.id IS NULL
        ELSE cr.is_used = ${Bit.zero}
        END`;
        const values = [coupon_id];
        const countValues = [coupon_id];

        let pagination = `ORDER BY u.${sort} LIMIT ${offset}, ${limit}`;
        if (!is_paginated) {
            pagination = `ORDER BY u.${sort}`;
        }
        if (!isEmptyField(user_type)) {
            condition += ` AND (u.user_type = ?)`
            values.push(user_type);
            countValues.push(user_type);
        }
        if (!isEmptyField(keyword)) {
            condition += ` AND (u.email LIKE ? OR u.device_id LIKE ? OR u.on_boarding_at LIKE ? OR u.first_name LIKE  ? OR u.last_name LIKE ?)`;
            for (let i = 0; i < 5; i++) {
                values.push(`%${keyword}%`);
                countValues.push(`%${keyword}%`);
            }
        }
        if (!isEmptyField(status)) {
            condition += ` AND (u.status = ?)`
            values.push(status);
            countValues.push(status);
        }
        if (!isEmptyField(is_pilot)) {
            condition += ` AND (u.is_pilot = ?)`
            values.push(is_pilot);
            countValues.push(is_pilot);
        }
        if (!isEmptyField(from_date)) {
            condition += ` AND DATE_FORMAT(u.on_boarding_at,'%Y-%m-%d %H:%i:%s') >= ?`
            values.push(from_date);
            countValues.push(from_date);
        }
        if (!isEmptyField(to_date)) {
            condition += ` AND DATE_FORMAT(u.on_boarding_at,'%Y-%m-%d %H:%i:%s') <= ?`
            values.push(to_date);
            countValues.push(to_date);
        }
        if (!isEmptyField(is_nukhba_user)) {
            condition += ` AND is_nukhba_user = ?`
            values.push(is_nukhba_user);
            countValues.push(is_nukhba_user);
        }
        if(!isEmptyField(campaign_title)){
            let campaign_title_trimmed = campaign_title.trim()
            condition += ` AND camp.title = ?`
            values.push(campaign_title_trimmed);
            countValues.push(campaign_title_trimmed);
        }
        if(!isEmptyField(user_invites_status)){
            condition += ` AND JSON_EXTRACT(u.other_details, '$.user_invites_status') = ?`
            values.push(Number(user_invites_status));
            countValues.push(Number(user_invites_status));
        }
        if(!isEmptyField(country_code)){
            condition += ` AND u.country_code like ?`
            values.push(`%${country_code}%`);
            countValues.push(`%${country_code}%`);
        }
        
        const text = `SELECT ${columns} 
        FROM ${Tables.COUPONS} cpn 
        INNER JOIN ${Tables.COUPON_REDEEM} cr ON cr.coupon_id = cpn.id
        INNER JOIN ${Tables.USERS} u ON cr.user_id = u.id
        LEFT JOIN ${Tables.CAMPAIGN} camp ON u.campaign_id = camp.id
        LEFT JOIN ${Tables.RESERVATIONS} rev ON rev.coupon_redeem_id = cr.id AND rev.status NOT IN (${CancelledBookingStatus})
        ${condition} ${pagination}`

        // const text = `SELECT ${columns} 
        // FROM ${Tables.USERS} u 
        // LEFT JOIN ${Tables.CAMPAIGN} camp ON u.campaign_id = c.id
        // INNER JOIN ${Tables.COUPON_REDEEM} cr ON cr.coupon_id = cpn.id
        // ${condition} ${pagination}`;

        const countText = `SELECT Count(*) as count 
        FROM ${Tables.COUPONS} cpn 
        INNER JOIN ${Tables.COUPON_REDEEM} cr ON cr.coupon_id = cpn.id
        INNER JOIN ${Tables.USERS} u ON cr.user_id = u.id
        LEFT JOIN ${Tables.CAMPAIGN} camp ON u.campaign_id = camp.id
        LEFT JOIN ${Tables.RESERVATIONS} rev ON rev.coupon_redeem_id = cr.id AND rev.status NOT IN (${CancelledBookingStatus})
        ${condition}`;

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

    static async getAllUnusedCpnUsrList(data) {
        const { 
            keyword,
            from_date,
            to_date,
            status,
            is_pilot, 
            is_nukhba_user, 
            campaign_title, 
            user_invites_status, 
            country_code,
            user_type,
            coupon_id
        } = data;
        const columns = `u.id, u.uid,
        u.first_name, 
        u.email, 
        u.country_code, 
        u.status, 
        camp.title as campaign_title, 
        u.fcm_token 
        `

        let condition = `WHERE u.status != ${UserStatus.deleted} AND cpn.uid = ? 
        AND CASE 
        WHEN cr.is_used = ${Bit.one}
        THEN rev.id IS NULL
        ELSE cr.is_used = ${Bit.zero}
        END`;
        const values = [coupon_id];
        const countValues = [coupon_id];

        
        if (!isEmptyField(user_type)) {
            condition += ` AND (u.user_type = ?)`
            values.push(user_type);
            countValues.push(user_type);
        }
        if (!isEmptyField(keyword)) {
            condition += ` AND (u.email LIKE ? OR u.device_id LIKE ? OR u.on_boarding_at LIKE ? OR u.first_name LIKE  ? OR u.last_name LIKE ?)`;
            for (let i = 0; i < 5; i++) {
                values.push(`%${keyword}%`);
                countValues.push(`%${keyword}%`);
            }
        }
        if (!isEmptyField(status)) {
            condition += ` AND (u.status = ?)`
            values.push(status);
            countValues.push(status);
        }
        if (!isEmptyField(is_pilot)) {
            condition += ` AND (u.is_pilot = ?)`
            values.push(is_pilot);
            countValues.push(is_pilot);
        }
        if (!isEmptyField(from_date)) {
            condition += ` AND DATE_FORMAT(u.on_boarding_at,'%Y-%m-%d %H:%i:%s') >= ?`
            values.push(from_date);
            countValues.push(from_date);
        }
        if (!isEmptyField(to_date)) {
            condition += ` AND DATE_FORMAT(u.on_boarding_at,'%Y-%m-%d %H:%i:%s') <= ?`
            values.push(to_date);
            countValues.push(to_date);
        }
        if (!isEmptyField(is_nukhba_user)) {
            condition += ` AND is_nukhba_user = ?`
            values.push(is_nukhba_user);
            countValues.push(is_nukhba_user);
        }
        if(!isEmptyField(campaign_title)){
            let campaign_title_trimmed = campaign_title.trim()
            condition += ` AND camp.title = ?`
            values.push(campaign_title_trimmed);
            countValues.push(campaign_title_trimmed);
        }
        if(!isEmptyField(user_invites_status)){
            condition += ` AND JSON_EXTRACT(u.other_details, '$.user_invites_status') = ?`
            values.push(Number(user_invites_status));
            countValues.push(Number(user_invites_status));
        }
        if(!isEmptyField(country_code)){
            condition += ` AND u.country_code like ?`
            values.push(`%${country_code}%`);
            countValues.push(`%${country_code}%`);
        }
        
        const text = `SELECT ${columns} 
        FROM ${Tables.COUPONS} cpn 
        INNER JOIN ${Tables.COUPON_REDEEM} cr ON cr.coupon_id = cpn.id
        INNER JOIN ${Tables.USERS} u ON cr.user_id = u.id
        LEFT JOIN ${Tables.CAMPAIGN} camp ON u.campaign_id = camp.id
        LEFT JOIN ${Tables.RESERVATIONS} rev ON rev.coupon_redeem_id = cr.id AND rev.status NOT IN (${CancelledBookingStatus})
        ${condition}`

        const statement = {
            text,
            values,
            rowsOnly: true
        }

        const result = await db.query(statement);
        return result.rows || []
    }

    static async getUsersByUids(uids) {
        const statement = {
            text: `SELECT 
                id, 
                uid, 
                status, 
                fcm_token
                FROM ${Tables.USERS} WHERE uid IN (${inMapper(uids)});`,
            values: [],
        }
        const result = await db.query(statement);
        return result.rows || [];
    } 
    static async findUsersWithMultipleUid(user_ids, transaction) {
        if (!Array.isArray(user_ids)) {
            user_ids = [user_ids]
        }
        const statement = {
            text: `select id from ${Tables.USERS} where uid IN (${inMapper(user_ids)});`,
            values: [],
            transaction
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findUserWithOnBoardingDate(startDate, endDate, transaction) {
        let condition = 'WHERE status <> 0 ';
        const values = []

        if (!isEmptyField(startDate)) {
            condition += ` AND DATE_FORMAT(on_boarding_at,'%Y-%m-%d %H:%i:%s') >= ?`
            values.push(startDate);
        }
        if (!isEmptyField(endDate)) {
            condition += ` AND DATE_FORMAT(on_boarding_at,'%Y-%m-%d %H:%i:%s') <= ?`
            values.push(endDate);
        }

        if (isEmptyField(startDate) && isEmptyField(startDate)) {
            throw new ServerError("startDate or endDate is required")
        }

        const statement = {
            text: `select id from ${Tables.USERS} ${condition};`,
            values,
            transaction
        }
        const result = await db.query(statement);
        return result.rows;

    }

    static async isAgentUsernameExists(agent_username, transaction) {
        const statement = {
            text: `select count(id) as count from ${Tables.USERS} where agent_username = ?;`,
            values: [agent_username],
            transaction
        }
        const result = await db.query(statement);
        return result.rows;
    }
}

module.exports = AgentModel;

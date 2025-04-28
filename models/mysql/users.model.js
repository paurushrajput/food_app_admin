const { db, inMapper, insertData, updateSingle, updateMultiple } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Bit, UserStatus, RowStatus, CancelledBookingStatus, BookingTrackStatus, USER_TYPE } = require("../../constants/database");
const { getKeyByValue } = require("../../utils/general");
const { isEmptyField } = require("../../utils/common");
const { DEFAULT_DASHBOARD_DATA_INTERVAL_DAYS } = require("../../constants/variables");
const ServerError = require("../../error/serverError");

class UsersModel {
    static async insert(users) {
        const statement = { ...insertData(Tables.USERS, users), operation: Operations.INSERT };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows inserted into ${Tables.USERS} table`
        };
    }

    static async updateOneById(columns, id, transaction = null) {
        const statement = { ...updateSingle(Tables.USERS, columns, id), operation: Operations.UPDATE, transaction };
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

    static async findUserWithUid(uid, transaction = null) {
        const statement = {
            text: `select id, uid,first_name,username, device_id, status, coordinates, user_type, other_details from ${Tables.USERS} where uid = ?;`,
            values: [uid],
            transaction
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

    static async getUserList(data) {
        let { sort, offset, limit, is_paginated, user_type, search,
            status, is_pilot, from_date, to_date, booking_count, is_nukhba_user,
            campaign_title, user_invites_status, country_code, referred_by,
            device_id, total_signedup_user, total_verified_user, allow_referral, allow_campaign } = data;

        const totalSignedUpQuery = `SELECT COUNT(*) from users u3
         where u3.referred_by = u.id   ` ;

        const totalVerifiedUser = `SELECT  COUNT(*) from users u3 where u3.referred_by = u.id
         and u3.is_mobile_verified  = 1` ;


        const columns = `u.uid as id, 
        u.first_name, 
        u.last_name, 
        u.email, 
        u.country_code,
        u.referral_code,
        u2.first_name as referred_by, 
        u2.referral_code as referred_by_code,
        (${totalSignedUpQuery}) as total_signedup_user,
        (${totalVerifiedUser}) as total_verified_user, 
        u.mobile, 
        u.address, 
        u.coordinates,
        u.device_id,
        u.last_seen, 
        u.last_login, 
        CAST(u.is_guest AS SIGNED) as is_guest, 
        u.on_boarding_at, 
        u.fcm_token,
        u.total_points AS coins,
        uw.amount AS credits,
        CAST(u.is_nukhba_user AS SIGNED) AS is_nukhba_user, 
        CAST(u.is_pilot AS SIGNED) AS is_pilot,
        u.created_at,
        u.other_details,
        COUNT(rv.id) AS booking_count,
        u.user_type,
        CASE
           WHEN u.referred_by IS NOT NULL THEN u2.referral_code
           ELSE c.title
        END AS campaign_title,
        CASE
           WHEN u.status = ${UserStatus.active} THEN '${getKeyByValue(UserStatus, UserStatus.active)}'
           WHEN u.status = ${UserStatus.deleted} THEN '${getKeyByValue(UserStatus, UserStatus.deleted)}'
           WHEN u.status = ${UserStatus.blocked} THEN '${getKeyByValue(UserStatus, UserStatus.blocked)}'
           WHEN u.status = ${UserStatus.suspended} THEN '${getKeyByValue(UserStatus, UserStatus.suspended)}'
           WHEN u.status = ${UserStatus.noshow} THEN '${getKeyByValue(UserStatus, UserStatus.noshow)}'
           ELSE '${RowStatus.active}'
        END AS status`

        // let condition = `WHERE 1`;
        // const values = [];
        // const countValues = [];

        let condition = ` WHERE u.status != ? AND u.user_type NOT IN (${USER_TYPE.AGENT},${USER_TYPE.INFLUENCER}) `;
        const values = [UserStatus.deleted];
        const countValues = [UserStatus.deleted];

        let pagination = ` LIMIT ${offset}, ${limit}`;
        if (!is_paginated) {
            pagination = ``;
        }


        if (allow_referral == Bit.zero) {
            condition += ` AND u.referred_by IS NULL `
        } else {
            if (allow_referral == Bit.one && isEmptyField(referred_by)) {
                condition += ` AND u.referred_by IS NOT NULL `
            }
            if (!isEmptyField(referred_by)) {
                condition += ` AND u.referred_by = (SELECT id from users where referral_code = ?)`
                values.push(`${referred_by}`);
                countValues.push(`${referred_by}`);
            }
        }

        if (!isEmptyField(user_type)) {
            condition += ` AND (u.user_type = ?)`
            values.push(user_type);
            countValues.push(user_type);
        }
        if (!isEmptyField(device_id)) {
            condition += ` AND (u.device_id = ?)`
            values.push(device_id);
            countValues.push(device_id);
        }
        if (!isEmptyField(search)) {
            condition += ` AND (u.email LIKE ? OR u.device_id LIKE ? OR u.on_boarding_at LIKE ? OR u.first_name LIKE  ? OR u.last_name LIKE ?)`;
            for (let i = 0; i < 5; i++) {
                values.push(`%${search}%`);
                countValues.push(`%${search}%`);
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
            condition += ` AND u.is_nukhba_user = ?`
            values.push(is_nukhba_user);
            countValues.push(is_nukhba_user);
        }

        if (allow_campaign == Bit.zero) {
            condition += ` AND u.campaign_id IS NULL `
        } else {
            if (allow_campaign == Bit.one) {
                condition += ` AND u.campaign_id IS NOT NULL `
            }

            if (!isEmptyField(campaign_title)) {
                let campaign_title_trimmed = campaign_title.trim()
                condition += ` AND CASE
                    WHEN u.referred_by IS NOT NULL THEN u2.referral_code = ?
                    ELSE c.title = ?
                    END`
                values.push(campaign_title_trimmed, campaign_title_trimmed);
                countValues.push(campaign_title_trimmed, campaign_title_trimmed);
            }
        }

        if (!isEmptyField(user_invites_status)) {
            condition += ` AND JSON_EXTRACT(u.other_details, '$.user_invites_status') = ?`
            values.push(Number(user_invites_status));
            countValues.push(Number(user_invites_status));
        }
        if (!isEmptyField(country_code)) {
            if (Number(country_code) == -1) {
                condition += ` AND u.country_code NOT LIKE ? AND u.country_code NOT LIKE ?`
                values.push(`%91%`, `%971%`);
                countValues.push(`%91%`, `%971%`);
            } else {
                condition += ` AND u.country_code LIKE ?`
                values.push(`%${country_code}%`);
                countValues.push(`%${country_code}%`);
            }
        }

        let havingCondition = ''
        if (!isEmptyField(booking_count)) {

            let bookingCountQuery;
            switch (booking_count) {
                case 1:
                    bookingCountQuery = "booking_count >= 1";
                    break;
                case 0:
                    bookingCountQuery = "booking_count = 0";
                    break;
                case 2:
                    bookingCountQuery = "booking_count = 1";
                    break;
                case 3:
                    bookingCountQuery = "booking_count = 2";
                    break;
                case 4:
                    bookingCountQuery = "booking_count >= 3";
                    break;
                case 5:
                    bookingCountQuery = "booking_count >= 5";
                    break;
                default:
                    break;
            }

            havingCondition = ` HAVING ${bookingCountQuery}`
        }

        if (!isEmptyField(total_signedup_user)) {

            let referralQuery;
            switch (total_signedup_user) {
                case 1:
                    referralQuery = " total_signedup_user >= 1 ";
                    break;
                case 0:
                    referralQuery = " total_signedup_user = 0 ";
                    break;
                case 2:
                    referralQuery = " total_signedup_user = 1 ";
                    break;
                case 3:
                    referralQuery = " total_signedup_user = 2 ";
                    break;
                case 4:
                    referralQuery = " total_signedup_user >= 3 ";
                    break;
                case 5:
                    referralQuery = " total_signedup_user >= 5 ";
                    break;
                default:
                    break;
            }

            if (havingCondition?.includes('HAVING')) {
                havingCondition += ` AND ${referralQuery} `
            } else {
                havingCondition = ` HAVING ${referralQuery}`
            }
        }

        if (!isEmptyField(total_verified_user)) {

            let referralVerifiedQuery;
            switch (total_verified_user) {
                case 1:
                    referralVerifiedQuery = " total_verified_user >= 1 ";
                    break;
                case 0:
                    referralVerifiedQuery = " total_verified_user = 0 ";
                    break;
                case 2:
                    referralVerifiedQuery = " total_verified_user = 1 ";
                    break;
                case 3:
                    referralVerifiedQuery = " total_verified_user = 2 ";
                    break;
                case 4:
                    referralVerifiedQuery = " total_verified_user >= 3 ";
                    break;
                case 5:
                    referralVerifiedQuery = " total_verified_user >= 5 ";
                    break;
                default:
                    break;
            }

            if (havingCondition?.includes('HAVING')) {
                havingCondition += ` AND ${referralVerifiedQuery} `
            } else {
                havingCondition = ` HAVING ${referralVerifiedQuery}`
            }
        }

        let joinCondition = `CASE 
                WHEN u.referred_by IS NOT NULL AND u2.user_type = 1 THEN c.agent_id = u.referred_by /*ND UNIX_TIMESTAMP(on_boarding_at) BETWEEN camp.start_date AND camp.end_date*/
                WHEN u.campaign_id IS NOT NULL THEN u.campaign_id = c.id
            END`

        // const bookingCount = `(SELECT COUNT(id) FROM ${Tables.RESERVATIONS} rv WHERE rv.user_id = u.id) AS booking_count`

        const text = `SELECT ${columns} 
        FROM ${Tables.USERS} u
        LEFT JOIN ${Tables.USERS} u2 ON u.referred_by = u2.id
        LEFT JOIN ${Tables.USER_WALLET} uw ON uw.user_id = u.id
        LEFT JOIN ${Tables.CAMPAIGN} c ON ${joinCondition}
        LEFT JOIN ${Tables.RESERVATIONS} rv ON rv.user_id = u.id AND rv.status NOT IN (${BookingTrackStatus.auto_cancelled}, ${BookingTrackStatus.payment_pending})
        ${condition} GROUP BY u.id ${havingCondition} ORDER BY u.${sort} ${pagination}`;

        const countText = `SELECT COUNT(*) AS count FROM (SELECT Count(distinct u.id) AS count, COUNT(rv.id) AS booking_count,
        (${totalSignedUpQuery}) as total_signedup_user,
        (${totalVerifiedUser}) as total_verified_user
        FROM ${Tables.USERS} u
        LEFT JOIN ${Tables.USERS} u2 ON u.referred_by = u2.id
        LEFT JOIN ${Tables.CAMPAIGN} c ON ${joinCondition}
        LEFT JOIN ${Tables.RESERVATIONS} rv ON rv.user_id = u.id AND rv.status NOT IN (${BookingTrackStatus.auto_cancelled}, ${BookingTrackStatus.payment_pending})
        ${condition} GROUP BY u.id ${havingCondition}) AS user_count`;

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
            condition += ` AND DATE_FORMAT(u.on_boarding_at,'%Y-%m-%d %H:%i:%s %H:%i.%s') >= ?`
            // values.push(from_date + ' 20:00:00');
            // countValues.push(from_date);
            values.push(from_date);
            countValues.push(from_date);
        }
        if (!isEmptyField(to_date)) {
            condition += ` AND DATE_FORMAT(u.on_boarding_at,'%Y-%m-%d %H:%i:%s %H:%i.%s') < ?`
            values.push(to_date);
            countValues.push(to_date);
        }
        if (!isEmptyField(is_nukhba_user)) {
            condition += ` AND is_nukhba_user = ?`
            values.push(is_nukhba_user);
            countValues.push(is_nukhba_user);
        }
        if (!isEmptyField(campaign_title)) {
            let campaign_title_trimmed = campaign_title.trim()
            condition += ` AND c.title = ?`
            values.push(campaign_title_trimmed);
            countValues.push(campaign_title_trimmed);
        }
        if (!isEmptyField(user_invites_status)) {
            condition += ` AND JSON_EXTRACT(u.other_details, '$.user_invites_status') = ?`
            values.push(Number(user_invites_status));
            countValues.push(Number(user_invites_status));
        }
        if (!isEmptyField(country_code)) {
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
        const statement = {
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

    static async findUserWithId(id, transaction = null) {
        const statement = {
            text: `SELECT  id, uid,first_name,last_name,email, device_id,on_boarding_at,status, user_type, total_points 
            FROM ${Tables.USERS} WHERE id = ?;`,
            values: [id],
            transaction
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
        if (!isEmptyField(campaign_title)) {
            let campaign_title_trimmed = campaign_title.trim()
            condition += ` AND camp.title = ?`
            values.push(campaign_title_trimmed);
            countValues.push(campaign_title_trimmed);
        }
        if (!isEmptyField(user_invites_status)) {
            condition += ` AND JSON_EXTRACT(u.other_details, '$.user_invites_status') = ?`
            values.push(Number(user_invites_status));
            countValues.push(Number(user_invites_status));
        }
        if (!isEmptyField(country_code)) {
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
        if (!isEmptyField(campaign_title)) {
            let campaign_title_trimmed = campaign_title.trim()
            condition += ` AND camp.title = ?`
            values.push(campaign_title_trimmed);
            countValues.push(campaign_title_trimmed);
        }
        if (!isEmptyField(user_invites_status)) {
            condition += ` AND JSON_EXTRACT(u.other_details, '$.user_invites_status') = ?`
            values.push(Number(user_invites_status));
            countValues.push(Number(user_invites_status));
        }
        if (!isEmptyField(country_code)) {
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

    static async findFcmToken(user_ids, transaction) {
        if (!Array.isArray(user_ids)) {
            user_ids = [user_ids]
        }

        const statement = {
            text: `select fcm_token from ${Tables.USERS} WHERE id IN (${inMapper(user_ids)}) AND fcm_token IS NOT NULL;`,
            values: [],
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

    static async isReferralCodeExists(referral_code, transaction) {
        const statement = {
            text: `select count(id) as count from ${Tables.USERS} where referral_code = ?;`,
            values: [referral_code],
            transaction
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findUsersWithUid(uids) {
        const statement = {
            text: `Select * from ${Tables.USERS} where uid in (${inMapper(uids)});`,
            values: [],
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async getOtherDetails(user_ids) {
        // AND u.user_type = ${Bit.one}
        // u.id      
        let condition = ` WHERE u.id IN (${inMapper(user_ids)}) order by u.created_at desc  `
        const values = []
        let dateFilterCondition = ''

        const totalSignedUpQuery = `SELECT COUNT(*) from users u2
         where u2.referred_by = u.id  ${dateFilterCondition} `;

        const totalVerifiedUser = `SELECT  COUNT(*) from users u2 where u2.referred_by = u.id
         and u2.is_mobile_verified  = 1 ${dateFilterCondition}`;

        const columns = ` u.uid as user_id,(${totalSignedUpQuery}) as total_signedup_user
        ,(${totalVerifiedUser}) as total_verified_user`
        const query = `select  ${columns}
        from ${Tables.USERS} u 
        ${condition} ;`

        const statement = {
            text: query,
            values: values,
        }

        const result1 = await db.query(statement);
        return result1.rows

    }

    static async getUserCountUsingMobile(country_code, mobile, transaction = null) {
        const statement = {
            text: `SELECT count(*) AS user_count 
                FROM ${Tables.USERS} 
                WHERE 
                    country_code = ? AND 
                    mobile = ? AND 
                    is_mobile_verified = ${Bit.one};`,
            values: [country_code, mobile],
            transaction
        }
        const result = await db.query(statement);
        return { userCount: result?.rows[0]?.user_count || 0 }
    }

    static async getUserDataById(id, transaction = null) {
        if (!id)
            return []
        const statement = {
            text: `SELECT 
                    usr.id, 
                    usr.uid,
                    usr.first_name,
                    usr.last_name,
                    usr.email,
                    usr.country_code,
                    usr.mobile, 
                    CAST(usr.is_pilot AS SIGNED) AS is_pilot, 
                    CAST(usr.is_nukhba_user AS SIGNED) AS is_nukhba_user,
                    usr.campaign_id,
                    usr.referred_by,
                    UNIX_TIMESTAMP(usr.on_boarding_at) AS on_boarding_at,
                    usr.status,
                    usr.user_type,
                    usr.total_points,
                    usr.fcm_token,
                    referee.id AS referee_id,
                    referee.user_type AS referee_type,
                    influencer.commission AS influencer_commission,
                    influencer.commission_type AS influencer_commission_type
                FROM ${Tables.USERS} usr
                LEFT JOIN ${Tables.USERS} referee ON usr.referred_by = referee.id
                LEFT JOIN ${Tables.INFLUENCERS} influencer ON influencer.user_id = referee.id
                WHERE usr.id = ?;`,
            values: [id],
            transaction
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async getUserDataByUid(id, transaction = null) {
        if (!id)
            return []
        const statement = {
            text: `SELECT 
                    usr.id, 
                    usr.uid,
                    usr.first_name,
                    usr.last_name,
                    usr.email,
                    usr.country_code,
                    usr.mobile, 
                    CAST(usr.is_pilot AS SIGNED) AS is_pilot, 
                    CAST(usr.is_nukhba_user AS SIGNED) AS is_nukhba_user,
                    usr.campaign_id,
                    usr.referred_by,
                    UNIX_TIMESTAMP(usr.on_boarding_at) AS on_boarding_at,
                    usr.status,
                    usr.user_type,
                    usr.total_points,
                    usr.fcm_token,
                    referee.id AS referee_id,
                    referee.user_type AS referee_type,
                    influencer.commission AS influencer_commission,
                    influencer.commission_type AS influencer_commission_type
                FROM ${Tables.USERS} usr
                LEFT JOIN ${Tables.USERS} referee ON usr.referred_by = referee.id
                LEFT JOIN ${Tables.INFLUENCERS} influencer ON influencer.user_id = referee.id
                WHERE usr.uid = ?;`,
            values: [id],
            transaction
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async getUsersHavingNoUsername(transaction = null) {
        let condition = `WHERE usr.status = ${Bit.one} AND usr.first_name IS NOT NULL
        AND usr.mobile IS NOT NULL AND usr.username IS NULL `
        
        const query = `SELECT 
                    usr.id, 
                    usr.uid,
                    usr.first_name,
                    usr.last_name,
                    usr.email,
                    usr.mobile, 
                    usr.status
                FROM ${Tables.USERS} usr ${condition}`

        const statement = {
            text: query,
            values: [],
            transaction
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findUserWithUsername(username, transaction = null) {
        const statement = {
            text: `select id, uid,username from ${Tables.USERS} where username = ? ;`,
            values: [username],
            transaction
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async getAllUserByIds(user_ids, transaction = null) {
        let name = `CONCAT(COALESCE(usr.first_name, ""), CASE WHEN NULLIF(usr.first_name,"") IS NULL THEN "" WHEN NULLIF(usr.last_name,"") IS NULL THEN "" ELSE " " END, COALESCE(usr.last_name, ""))`
        const statement = {
            text: `select 
            usr.id, 
            usr.uid,
            usr.first_name, 
            usr.last_name,
            ${name} AS full_name, 
            usr.country_code, 
            usr.mobile, 
            usr.username,
            usr.email,
            COALESCE(CONCAT(m.basePath,'/',m.filename),'') as profile_pic
            FROM ${Tables.USERS} usr
            LEFT JOIN ${Tables.MEDIA} m ON m.id = usr.profile_pic_id
            WHERE usr.id IN (${inMapper(user_ids)}) AND usr.status IN (${Bit.one});`,
            values: [],
            transaction
        }
        const result = await db.query(statement);
        return result.rows;
    }

}

module.exports = UsersModel;

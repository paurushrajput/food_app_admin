const { db, inMapper, insertData, updateSingle, updateMultiple } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Bit, UserStatus, RowStatus, CancelledBookingStatus, BookingTrackStatus, USER_TYPE, InfluencerApprovalStatus } = require("../../constants/database");
const { getKeyByValue } = require("../../utils/general");
const { isEmptyField } = require("../../utils/common");
const { DEFAULT_DASHBOARD_DATA_INTERVAL_DAYS } = require("../../constants/variables");
const ServerError = require("../../error/serverError");

class InfluencersModel {

    static async getInfluencersList(data) {
        let { sort, offset, limit, is_paginated, user_type, search,
            status, is_pilot, from_date, to_date, booking_count, is_nukhba_user,
            campaign_title, user_invites_status, country_code, referred_by,
            device_id, total_signedup_user, total_verified_user, allow_referral, allow_campaign } = data;

        const totalSignedUpQuery = `SELECT COUNT(*) from users u3
         where u3.referred_by = u.id   ` ;

        const totalVerifiedUser = `SELECT  COUNT(*) from users u3 where u3.referred_by = u.id
         and u3.is_mobile_verified  = 1` ;


        const columns = `inf.uid as id, 
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
        CAST(u.is_nukhba_user AS SIGNED) AS is_nukhba_user, 
        CAST(u.is_pilot AS SIGNED) AS is_pilot,
        inf.created_at,
        u.other_details,
        COUNT(rv.id) AS booking_count,
        u.user_type,
        inf.user_id,
        CAST(inf.has_freelancer_license AS SIGNED) AS has_freelancer_license, 
        CAST(inf.tnc_accepted AS SIGNED) AS tnc_accepted,
        CAST(inf.status AS SIGNED) AS influencer_status_value,
        inf.commission_type,
        inf.commission,
        inf.approved_at,
        inf.approved_by,
        CONCAT(m.basePath,'/',m.filename) as license_document,
        inf.remark,
        CASE
           WHEN u.referred_by IS NOT NULL THEN u2.referral_code
           ELSE c.title
        END AS campaign_title,
        CASE
           WHEN inf.status = ${InfluencerApprovalStatus.PENDING} THEN '${getKeyByValue(InfluencerApprovalStatus, InfluencerApprovalStatus.PENDING)}'
           WHEN inf.status = ${InfluencerApprovalStatus.APPROVED} THEN '${getKeyByValue(InfluencerApprovalStatus, InfluencerApprovalStatus.APPROVED)}'
           WHEN inf.status = ${InfluencerApprovalStatus.REJECTED} THEN '${getKeyByValue(InfluencerApprovalStatus, InfluencerApprovalStatus.REJECTED)}'
           ELSE '${InfluencerApprovalStatus.PENDING}'
        END AS influencer_status,
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

        let condition = ` WHERE u.status != ? AND u.user_type <> ${USER_TYPE.AGENT}`;
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
        LEFT JOIN ${Tables.CAMPAIGN} c ON ${joinCondition}
        INNER JOIN ${Tables.INFLUENCERS} as inf ON u.id = inf.user_id 
        LEFT JOIN ${Tables.MEDIA} m ON inf.license_document = m.id
        LEFT JOIN ${Tables.RESERVATIONS} rv ON rv.user_id = u.id AND rv.status NOT IN (${BookingTrackStatus.auto_cancelled}, ${BookingTrackStatus.payment_pending})
        ${condition} GROUP BY u.id ${havingCondition} ORDER BY u.${sort} ${pagination}`;

        const countText = `SELECT COUNT(*) AS count FROM (SELECT Count(distinct u.id) AS count, COUNT(rv.id) AS booking_count,
        (${totalSignedUpQuery}) as total_signedup_user,
        (${totalVerifiedUser}) as total_verified_user
        FROM ${Tables.USERS} u
        LEFT JOIN ${Tables.USERS} u2 ON u.referred_by = u2.id
        LEFT JOIN ${Tables.CAMPAIGN} c ON ${joinCondition}
        INNER JOIN ${Tables.INFLUENCERS} as inf ON u.id = inf.user_id
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

    static async updateOneById(columns, id,transaction) {
        const statement = {
          ...updateSingle(Tables.INFLUENCERS, columns, id),
          operation: Operations.UPDATE,transaction
        };
        const result = await db.query(statement);
        const affectedRows = Number(
          JSON.parse(JSON.stringify(result))?.rows?.affectedRows
        );
        return {
          rows: affectedRows,
          msg: `${affectedRows} rows updated into ${Tables.INFLUENCERS} table`,
        };
    }

    static async findWithUid(uid) {
        const statement = {
            text: `Select id,uid,user_id, CAST(status AS SIGNED) as status 
            from ${Tables.INFLUENCERS} where uid = ?  ;`,
            values: [uid],
        }
        const result = await db.query(statement);
        return result.rows[0];
    }

   
}

module.exports = InfluencersModel;

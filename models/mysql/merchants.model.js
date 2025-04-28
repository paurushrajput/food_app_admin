const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Status, Bit, MerchantType, RestaurantApproval, UnknownUser, ReservationTrackStatus, RESTAURANT_LIST_TYPE, RESTAURANT_TYPE } = require("../../constants/database");
const { isEmptyField, getTrimmedValue } = require("../../utils/common");

class MerchantsModel {

    static async insert(logins) {
        const statement = { ...insertData(Tables.MERCHANTS, logins), operation: Operations.INSERT };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows inserted into ${Tables.MERCHANTS} table`
        };
    }

    static async updateOneById(columns, id) {
        const statement = { ...updateSingle(Tables.MERCHANTS, columns, id), operation: Operations.UPDATE };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows updated into ${Tables.MERCHANTS} table`
        };
    }

    static async findIdWithEmailOrPhone(emailOrPhone) {
        const statement = {
            text: `select id, uid, status, is_email_verified, is_mobile_verified from ${Tables.MERCHANTS} where email = ? or mobile = ?;`,
            values: [emailOrPhone],
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async getMerchantList(data) {
        const { sort, offset, limit, is_paginated, merchant_type, keyword } = data;

        const columns = `m.uid as id, TRIM(BOTH ' ' FROM concat(COALESCE(m.first_name,''),' ',COALESCE(m.last_name,''))) as name, r.name as restaurant_name,
        l.name as location_name,
        COUNT(r.id) as resturant_count,
        m.email, m.mobile, UNIX_TIMESTAMP(m.created_at) as created_at,
        CASE
           WHEN (m.is_email_verified = ${Bit.one} OR m.is_mobile_verified = ${Bit.one}) THEN ${Bit.one}
           ELSE ${Bit.zero}
        END AS is_verified
        ` //FIXME: this condition needs to be "and" later, when moved to production
        let condition = `where m.status = ${Status.one}`;
        let pagination = ` limit ${offset} , ${limit}`;
        const values = [];
        const countValues = [];
        if (!is_paginated || is_paginated.toString() === 'false') {
            pagination = ``;
        }
        if (merchant_type && merchant_type !== "") {
            if (merchant_type == MerchantType.VERIFIED) {
                condition += ` AND (m.is_email_verified = ? OR m.is_mobile_verified = ?)` //FIXME: this condition needs to be "and" later, when moved to production
                values.push(Bit.one);
                values.push(Bit.one);
                countValues.push(Bit.one);
                countValues.push(Bit.one);
            } else if (merchant_type == MerchantType.UNVERIFIED) {
                condition += ` AND (m.is_email_verified = ? AND m.is_mobile_verified = ?)` //FIXME: this condition needs to be "and" later, when moved to production
                values.push(Bit.zero);
                values.push(Bit.zero);
                countValues.push(Bit.zero);
                countValues.push(Bit.zero);
            }
        }

        if (keyword && keyword !== '') {
            condition += ` AND (m.email LIKE ? OR m.mobile LIKE ? OR m.first_name LIKE ? OR m.last_name LIKE ?)`;
            values.push(`%${keyword}%`);
            values.push(`%${keyword}%`);
            values.push(`%${keyword}%`);
            values.push(`%${keyword}%`);
            countValues.push(`%${keyword}%`);
            countValues.push(`%${keyword}%`);
            countValues.push(`%${keyword}%`);
            countValues.push(`%${keyword}%`);
        }

        const resCondition = ` AND (NULLIF(r.name, "") IS NOT NULL OR NULLIF(r.email, "") IS NOT NULL OR NULLIF(r.phone, "") IS NOT NULL)`;

        const text = `SELECT ${columns} from ${Tables.MERCHANTS} m LEFT JOIN ${Tables.RESTAURANTS} r ON m.id = r.mer_id ${resCondition}
        LEFT JOIN ${Tables.LOCATION} l on r.location_id = l.id
        ${condition} GROUP BY m.id order by ${sort} ${pagination}`;
        const countText = `SELECT Count(DISTINCT m.id) as count from ${Tables.MERCHANTS} m LEFT JOIN ${Tables.RESTAURANTS} r ON m.id = r.mer_id ${resCondition}
        LEFT JOIN ${Tables.LOCATION} l on r.location_id = l.id ${condition}`;

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

    static async findMerchantWithUId(uid) {
        const statement = {
            text: `select id, uid from ${Tables.MERCHANTS} where uid = ?;`,
            values: [uid],
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findMerchantRestaurant(id) {
        const statement = {
            text: `SELECT  r.uid as id, r.name, r.email, r.phone, r.address, r.coordinates, r.total_seats, r.icon, r.about, r.branch_name,
            JSON_OBJECT('id', m.uid, 'name', concat(m.first_name,' ',m.last_name), 'email', m.email, 'mobile', m.mobile, 'created_at', UNIX_TIMESTAMP(m.created_at)) as merchant,
            CASE
               WHEN r.is_approved = ${Bit.one} THEN '${RestaurantApproval.APPROVED}'
               WHEN r.is_approved = ${Bit.zero} THEN '${RestaurantApproval.REJECTED}'
               ELSE '${RestaurantApproval.PENDING}'
            END AS approval_status
            FROM ${Tables.RESTAURANTS} r
            INNER JOIN ${Tables.MERCHANTS} m ON r.mer_id = m.id
            WHERE m.id = ? AND r.is_approved = ${Bit.one} AND r.status = ${Bit.one};`,
            values: [id]
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async getRestaurantList(data) {
        const { sort, offset, limit, is_paginated, restaurant_type, keyword, location_id, category_id, mer_id, status, approval_status, is_pilot, res_status, type } = data;

        const last_payment = `(SELECT JSON_OBJECT('amount', amount, 'payment_date', payment_date, 'created_at', created_at) from ${Tables.COMMISSION_PAYMENT_HISTORY} WHERE res_id = r.id AND status = ${Status.one} AND deleted_at IS NULL ORDER BY id desc limit 1) as last_payment`
        const columns = `
        r.uid as id, 
        r.name, 
        r.email, 
        r.phone, 
        r.address, 
        r.coordinates, 
        r.icon, 
        r.about,
        CAST(r.is_instant_payment AS SIGNED) as enable_instant_payment,
        r.instant_pay_amt_pct,
        r.auto_booking,
        r.commission_base_price,
        r.commission_advance,
        r.commission_currency,
        r.commission_type,
        r.commission_settled,
        r.on_boarded_by,
        r.approved_by,
        r.live_by,
        r.pilot_by,
        r.pilot_at,
        r.type,
        r.pax_commission_type,
        r.pax_details,
        r.created_at,
        r.type,
        CAST(r.booking_fee_required AS SIGNED) as booking_fee_required,
        CAST(r.voucher_applicable AS SIGNED) as voucher_applicable,
        CAST(r.credits_applicable AS SIGNED) as credits_applicable,
        r.rev_msg_template,
        r.status,
        r.other_details,
        CAST(r.is_pilot AS SIGNED) AS is_pilot,
        IF(COUNT(c.name) = 0, JSON_ARRAY(),JSON_ARRAYAGG(c.name)) as cousines,
        l.name as location_name,
        (select SUM(COALESCE(sl.seats_allocated, 0)) from ${Tables.SLOTS} sl where sl.res_id = r.id and (sl.status <> 0 or sl.status is null)) as seats_allocated,
        (SELECT JSON_OBJECT('total_commission', SUM(COALESCE(commission, 0)), 'revenue', SUM(COALESCE(discounted_amount, 0)), 'total_guest', SUM(COALESCE(total_guest, 0))) from ${Tables.RESERVATIONS} where res_id = r.id and status = ${status}) as booking,
        JSON_OBJECT('id', m.uid, 'name', concat(m.first_name, ' ', m.last_name), 'email', m.email, 'mobile', m.mobile, 'created_at', UNIX_TIMESTAMP(m.created_at)) as merchant,
        ${last_payment},
        CASE
           WHEN r.is_approved = ${Bit.one} THEN '${RestaurantApproval.APPROVED}'
           WHEN r.is_approved = ${Bit.zero} THEN '${RestaurantApproval.REJECTED}'
           ELSE '${RestaurantApproval.PENDING}'
        END AS approval_status`;

        const values = [];
        const countValues = [];

        let typeCond = '';

        if(type == RESTAURANT_LIST_TYPE.DEAL){
            typeCond = ` AND r.type IN (${inMapper([RESTAURANT_TYPE.ALL, RESTAURANT_TYPE.DEAL])}) `
        } else if(type == RESTAURANT_LIST_TYPE.RESERVATION){
            typeCond = ` AND r.type IN (${inMapper([RESTAURANT_TYPE.ALL, RESTAURANT_TYPE.RESERVATION])}) `
        }

        let condition = ` ${typeCond} AND (NULLIF(r.name, "") IS NOT NULL OR NULLIF(r.email, "") IS NOT NULL OR NULLIF(r.phone, "") IS NOT NULL)`;
        let pagination = ` LIMIT ${limit} OFFSET ${offset}`;

        if (!is_paginated) {
            pagination = ``;
        }

        if (keyword && keyword !== '') {
            condition += ` AND (r.uid LIKE ? OR r.name LIKE ? OR r.email LIKE ? OR l.name LIKE ? OR r.address LIKE ? )`;
            values.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
            countValues.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
        }



        if (restaurant_type && restaurant_type !== "") {
            if (restaurant_type == RestaurantApproval.APPROVED) {
                condition += ` AND r.is_approved = ?`;
                values.push(Bit.one);
                countValues.push(Bit.one);

                condition += ` AND r.status = ?`
                values.push(`${Bit.one}`)
                countValues.push(`${Bit.one}`)
            } else if (restaurant_type == RestaurantApproval.REJECTED) {
                condition += ` AND r.is_approved = ?`;
                values.push(Bit.zero);
                countValues.push(Bit.zero);
            } else if (restaurant_type == RestaurantApproval.PENDING) {
                condition += ` AND r.is_approved IS NULL`;
            }
        }

        if (location_id && location_id !== "") {
            condition += ` AND r.location_id = ?`;
            values.push(location_id);
            countValues.push(location_id);
        }

        if (category_id && category_id !== "") {
            condition += ` AND EXISTS (SELECT 1 FROM restaurant_categories rc WHERE rc.res_id = r.id AND rc.cat_id = ?)`;
            values.push(category_id);
            countValues.push(category_id);
        }

        if (mer_id && mer_id !== "") {
            condition += ` AND m.uid = ?`
            values.push(mer_id);
            countValues.push(mer_id);
        }

        if (!isEmptyField(approval_status)) {
            let apprValue;
            if (getTrimmedValue(approval_status) === RestaurantApproval.APPROVED) {
                apprValue = Bit.one;
                condition += ` AND r.is_approved = ?`
                values.push(apprValue);
                countValues.push(apprValue);
            }
            else if (getTrimmedValue(approval_status) === RestaurantApproval.REJECTED) {
                apprValue = Bit.zero;
                condition += ` AND r.is_approved = ?`
                values.push(apprValue);
                countValues.push(apprValue);
            }
            else {
                condition += ` AND r.is_approved IS NULL`
            }
        }

        if (!isEmptyField(is_pilot)) {
            condition += ` AND r.is_pilot = ?`;
            values.push(is_pilot);
            countValues.push(is_pilot);
            if (is_pilot == "0" && isEmptyField(res_status)) {
                condition += ` AND r.is_approved = ? AND r.status = ?`
                values.push(Bit.one, Bit.one);
                countValues.push(Bit.one, Bit.one);
            }
        }

        // res_status = "active"     //active restaurant (approved+pending+rejected)
        // res_status = "inactive"   //active restaurant (approved+pending+rejected)
        // res_status = "pending"    //pending active restaurant
        // res_status = "approved"   //approved active restaurant
        // res_status = "rejected"   //rejected active restaurant

        if (!isEmptyField(res_status)) {
            if (res_status == "active") {
                condition += ` AND r.status = ?`;
                values.push(Bit.one);
                countValues.push(Bit.one);
            }
            if (res_status == "inactive") {
                condition += ` AND r.status = ?`;
                values.push(Bit.zero);
                countValues.push(Bit.zero);
            }
            if (res_status == RestaurantApproval.PENDING) {
                condition += ` AND (r.is_approved NOT IN (?,?) OR r.is_approved IS NULL) AND r.status = ?`;
                values.push(Bit.one, Bit.zero, Bit.one);
                countValues.push(Bit.one, Bit.zero, Bit.one);
            }
            if (res_status == RestaurantApproval.APPROVED) {
                condition += ` AND r.is_approved = ? AND r.status = ?`;
                values.push(Bit.one, Bit.one);
                countValues.push(Bit.one, Bit.one);
            }
            if (res_status == RestaurantApproval.REJECTED) {
                condition += ` AND r.is_approved = ? AND r.status = ?`;
                values.push(Bit.zero, Bit.one);
                countValues.push(Bit.zero, Bit.one);
            }
        }

        const text = `SELECT ${columns} FROM ${Tables.MERCHANTS} m
        INNER JOIN ${Tables.RESTAURANTS} r ON m.id = r.mer_id
        LEFT JOIN ${Tables.RESTAURANT_CATEGORIES} rc on r.id = rc.res_id
        LEFT JOIN ${Tables.CATEGORIES} c on c.id = rc.cat_id
        LEFT JOIN ${Tables.LOCATION} l on r.location_id = l.id
        WHERE 1 ${condition}
        GROUP BY r.id ORDER BY r.${sort} ${pagination}`;

        const countText = `SELECT COUNT(DISTINCT r.id) as count FROM ${Tables.MERCHANTS} m
        INNER JOIN ${Tables.RESTAURANTS} r ON m.id = r.mer_id
        LEFT JOIN ${Tables.RESTAURANT_CATEGORIES} rc on r.id = rc.res_id
        LEFT JOIN ${Tables.CATEGORIES} c on c.id = rc.cat_id
        LEFT JOIN ${Tables.LOCATION} l on r.location_id = l.id
        WHERE 1 ${condition}`;

        const statement = {
            text,
            values,
            rowsOnly: true
        };

        const countStatement = {
            text: countText,
            values: countValues,
            rowsOnly: true,
        };

        const listPr = db.query(statement);
        const countPr = db.query(countStatement);

        const promiseData = await Promise.all([listPr, countPr]);

        return {
            count: promiseData[1]?.rows[0]?.count,
            rows: promiseData[0]?.rows,
        };
    }

    static async findMerchantDetailsForLogin(uid, transaction) {
        const firstname = `CASE WHEN first_name IS NULL OR first_name = '' THEN '' ELSE first_name END`
        const lastname = `CASE WHEN last_name IS NULL OR last_name = '' THEN '' ELSE last_name END`
        const name = `CASE WHEN last_name IS NULL OR last_name = '' THEN CONCAT(${firstname}) ELSE CONCAT(${firstname},' ',${lastname}) END`


        const statement = {
            text: `select id, uid, status, CAST(is_email_verified AS SIGNED) as is_email_verified, CAST(is_mobile_verified AS SIGNED) as is_mobile_verified, otp, country_code, email, mobile, IFNULL(NULLIF(${name}, '') , '${UnknownUser}') AS name from ${Tables.MERCHANTS} where uid = ? ;`,
            values: [uid],
            transaction
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async getMerchantByColumn(body) {
        const { column = 'id', value = "" } = body;
        let text = `SELECT id, uid, status, CAST(is_email_verified AS SIGNED) as is_email_verified, CAST(is_mobile_verified AS SIGNED) as is_mobile_verified, country_code, otp, email, mobile from ${Tables.MERCHANTS} Where ${column} = ?;`
        const statement = {
            text,
            values: [value],
            rowsOnly: true,
        }
        const result = await db.query(statement);
        return result.rows;
    };

    static async findAllRestaurantsByMerchants(merchantId) {
        const text = `SELECT id, uid, status, name, CAST(is_pilot AS SIGNED) AS is_pilot from ${Tables.RESTAURANTS} Where mer_id = ?;`
        const statement = {
            text,
            values: [merchantId],
        }
        const result = await db.query(statement);
        return result.rows;
    };
}

module.exports = MerchantsModel;
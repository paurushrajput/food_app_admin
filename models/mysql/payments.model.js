const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, UserStatus, PAYMENT_TYPE } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common.js");
const { PaymentStatus, OrderStatusCode } = require("../../constants/payments.js");

class PaymentsModel {
    static async getPaymentList(body) {

        const { 
            sort, 
            offset, 
            limit, 
            restaurant_name, 
            user_email, 
            reservation_id, 
            from_date, 
            to_date, 
            slot_time, 
            amount, 
            payment_date_start, 
            payment_date_end, 
            payment_status, 
            payment_mode,
            is_paginated,
            is_nukhba_user,
            is_pilot,
            type,
            order_status_code
        } = body;
        //DATE(r.created_at) AS booking_created_date, 
        //DATE_FORMAT(r.created_at,'%H:%i:%s') AS booking_created_time, 

        const columns = ` p.uid AS payment_id, 
        u.uid AS user_id, 
        u.status AS user_status,
        CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,'')) AS username,
        u.email AS user_email,
        u.country_code AS country_code,
        u.mobile AS user_mobile,
        r.uid AS reservation_id, 
        r.total_guest AS total_guest, 
        rest.name AS restaurant_name, 
        DATE(r.booking_start) AS booking_date, 
        s.start_time AS slot_time,
        s.uid AS slot_id,
        r.created_at,
        CAST(r.is_instant_payment AS SIGNED) AS payment_type,
        CONCAT(p.amount,' ',p.currency) AS amount, 
        CONCAT(p.pending_amount,' ',p.currency) AS pending_amount, 
        DATE(p.created_at) AS payment_date,
        DATE_FORMAT(p.created_at,'%H:%i') AS payment_time,
        p.ref_txn_id AS ref_txn_id,
        p.status AS payment_status, 
        p.other_details,
        p.payment_mode,
        p.order_status_code,
        p.txn_status_code,
        cn.name AS rest_country_name,
        city.name AS rest_city_name,
        loc.name AS rest_location_name,
        CAST(r.is_nukhba_user AS SIGNED) AS is_nukhba_user,
        CAST(r.is_pilot AS SIGNED) AS is_pilot,
        CASE
           WHEN u.status = ${UserStatus.deleted} THEN 1
           ELSE 0
        END AS is_deleted_user`

        let condition = ` WHERE p.deleted_at is null `;

        let pagination = `ORDER BY p.${sort} LIMIT ${offset}, ${limit}`;

        const values = [];
        const countValues = [];

        if (!is_paginated || is_paginated === "" || is_paginated.toString() === 'false') {
            pagination = `ORDER BY p.${sort}`;
        }

        const filterCondition = [];

        let booking_date_filter = '';
        let payment_date_filter = '';

        if (!isEmptyField(type)) {
            if (type == PAYMENT_TYPE.RESERVATION) {
                filterCondition.push(` r.is_instant_payment = ? `)
                values.push(`${type}`);
                countValues.push(`${type}`);
            } else if (type == PAYMENT_TYPE.INSTANT_PAYMENT) {
                filterCondition.push(` r.is_instant_payment = ? `)
                values.push(`${type}`);
                countValues.push(`${type}`);
            }
        }

        if (!isEmptyField(restaurant_name)) {
            filterCondition.push(` rest.name LIKE ? `)
            values.push(`%${restaurant_name}%`);
            countValues.push(`%${restaurant_name}%`);
        }

        if (!isEmptyField(user_email)) {
            filterCondition.push(` u.email LIKE ? `)
            values.push(`%${user_email}%`);
            countValues.push(`%${user_email}%`);
        }

        if (!isEmptyField(reservation_id)) {
            filterCondition.push(` r.uid = ? `)
            values.push(`${reservation_id}`);
            countValues.push(`${reservation_id}`);
        }

        if (!isEmptyField(slot_time)) {
            filterCondition.push(` s.slot_time = ? `)
            values.push(`${slot_time}`);
            countValues.push(`${slot_time}`);
        }

        if (!isEmptyField(amount)) {
            filterCondition.push(` p.amount LIKE ? `)
            values.push(`%${amount}%`);
            countValues.push(`%${amount}%`);
        }

        if (!isEmptyField(payment_status)) {
            filterCondition.push(` p.status = ? `)
            values.push(`${payment_status}`);
            countValues.push(`${payment_status}`);
        }

        if (!isEmptyField(order_status_code) && order_status_code === PaymentStatus.clickedBack.value  ) {
            filterCondition.push(` p.status = ? `)
            values.push(`${order_status_code}`);
            countValues.push(`${order_status_code}`);
            
        }else if (!isEmptyField(order_status_code) && order_status_code === OrderStatusCode.cancelled  ) {
            filterCondition.push(` p.order_status_code = ? AND p.status <> ? `)
            values.push(`${order_status_code}`,PaymentStatus.clickedBack.value);
            countValues.push(`${order_status_code}`,PaymentStatus.clickedBack.value);  
        }else if (!isEmptyField(order_status_code)) {
            filterCondition.push(` p.order_status_code = ? AND p.status NOT IN (${PaymentStatus.clickedBack.value})  `)
            values.push(`${order_status_code}`);
            countValues.push(`${order_status_code}`);
        }

        if (!isEmptyField(payment_mode)) {
            filterCondition.push(` p.payment_mode = ? `)
            values.push(`${payment_mode}`);
            countValues.push(`${payment_mode}`);
        }

        if (filterCondition.length > 0) {
            condition += ` AND ( ${filterCondition.join(" AND ")} )`
        }

        if (!isEmptyField(from_date)) {
            booking_date_filter += ` DATE_FORMAT(p.created_at,'%Y-%m-%d %H:%i:%s %H:%i.%s') >= ? `
            values.push(`${from_date}`);
            countValues.push(`${from_date}`);
        }

        if (!isEmptyField(to_date)) {
            if (booking_date_filter.trim() != "") {
                booking_date_filter += ' AND '
            }
            booking_date_filter += ` DATE_FORMAT(p.created_at,'%Y-%m-%d %H:%i:%s %H:%i.%s') <= ? `
            values.push(`${to_date}`);
            countValues.push(`${to_date}`);
        }

        if (booking_date_filter.trim() != "") {
            condition += ` AND ( ${booking_date_filter} )`
        }


        if (!isEmptyField(payment_date_start)) {
            payment_date_filter += ` DATE_FORMAT(p.created_at,'%Y-%m-%d %H:%i:%s') >= ? `
            values.push(`${payment_date_start}`);
            countValues.push(`${payment_date_start}`);
        }

        if (!isEmptyField(payment_date_end)) {
            if (payment_date_filter.trim() != "") {
                payment_date_filter += ' AND '
            }
            payment_date_filter += ` DATE_FORMAT(p.created_at,'%Y-%m-%d %H:%i:%s') >= ? `
            values.push(`${payment_date_end}`);
            countValues.push(`${payment_date_end}`);
        }

        if (payment_date_filter.trim() != "") {
            condition += ` AND ( ${payment_date_filter} )`
        }

        if (!isEmptyField(is_nukhba_user)) {
            condition += ` AND r.is_nukhba_user = ? `
            values.push(is_nukhba_user);
            countValues.push(is_nukhba_user);
        }

        if (!isEmptyField(is_pilot)) {
            condition += ` AND r.is_pilot = ? `
            values.push(is_pilot);
            countValues.push(is_pilot);
        }

        const text = `SELECT ${columns} FROM ${Tables.PAYMENTS} p 
        JOIN ${Tables.USERS} u ON p.user_id = u.id
        JOIN ${Tables.RESERVATIONS} r ON p.reservation_id = r.id
        JOIN ${Tables.RESTAURANTS} rest ON r.res_id = rest.id 
        JOIN ${Tables.SLOTS} s ON r.slot_id = s.id
        LEFT JOIN ${Tables.COUNTRIES} cn ON cn.id = rest.country_id
        LEFT JOIN ${Tables.CITIES} city ON city.id = rest.city_id
        LEFT JOIN ${Tables.LOCATION} loc ON loc.id = rest.location_id
        ${condition} ${pagination};`
        const countText = `SELECT Count(p.id) AS count FROM ${Tables.PAYMENTS} p 
        JOIN ${Tables.USERS} u ON p.user_id = u.id
        JOIN ${Tables.RESERVATIONS} r ON p.reservation_id = r.id
        JOIN ${Tables.RESTAURANTS} rest ON r.res_id = rest.id 
        JOIN ${Tables.SLOTS} s ON r.slot_id = s.id
        ${condition}`;

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
            count: promiseData[1]?.rows[0]?.count,
            rows: promiseData[0]?.rows,
        }
    };

    static async updateOneById(columns, id, transaction = null) {
        const statement = { ...updateSingle(Tables.PAYMENTS, columns, id), operation: Operations.UPDATE, transaction };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows updated into ${Tables.PAYMENTS} table`
        };
    }

    static async getOneByColumns(body, transaction = null) {
        const { columns = ['id'], values = [""] } = body;
        let columnsString = ``
        columns.map(el => {
            columnsString += `${el} = ? AND `
        })

        const columnsStringLastIndex = columnsString.trim().lastIndexOf('AND');
        columnsString = columnsString.substr(0, columnsStringLastIndex);

        let text = `SELECT id, uid, status, ref_txn_id, order_status_code,
            actual_amount, amount, currency, other_details, nukhba_credits_used 
        FROM ${Tables.PAYMENTS} WHERE ${columnsString} AND deleted_at IS NULL;`

        const statement = {
            text,
            values: [...values],
            rowsOnly: true,
            transaction
        }

        const result = await db.query(statement);

        return result.rows;
    };

    static async getAllPayments() {
        let text = `SELECT 
          id, uid, status, amount, other_details
          FROM ${Tables.PAYMENTS} 
          WHERE 
            deleted_at IS NULL;`
    
        const statement = {
          text,
          values: [],
          rowsOnly: true,
        }
    
        const result = await db.query(statement);
    
        return result.rows;
    };

    static async getAllPendingStatusCodePayments() {
        let text = `SELECT 
          id, uid, status, amount, ref_txn_id, other_details
          FROM ${Tables.PAYMENTS} 
          WHERE 
            TIMESTAMPDIFF(MINUTE, created_at, NOW()) >= 60 AND
            (order_status_code = 1 OR order_status_code IS NULL) AND deleted_at IS NULL;`
    
        const statement = {
          text,
          values: [],
          rowsOnly: true,
        }
    
        const result = await db.query(statement);
    
        return result.rows;
    };
}

module.exports = PaymentsModel;
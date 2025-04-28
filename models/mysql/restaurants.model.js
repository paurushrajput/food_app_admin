const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Bit, Status, RestaurantApproval, SlotsStatus, FilterCondnType, BookingTrackStatus } = require("../../constants/database");
const { MAX_AMENITIES } = require("../../constants/variables");
const { isEmptyField, getTrimmedValue } = require("../../utils/common");
const { PaymentStatus } = require("../../constants/payments");

class RestaurantsModel {

    static async insert(users) {
        const statement = { ...insertData(Tables.RESTAURANTS, users), operation: Operations.INSERT };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows inserted into ${Tables.RESTAURANTS} table`
        };
    }

    static async updateOneById(columns, id) {
        const statement = { ...updateSingle(Tables.RESTAURANTS, columns, id), operation: Operations.UPDATE };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows updated into ${Tables.RESTAURANTS} table`
        };
    }

    static async findActiveCuisines() {
        const statement = {
            text: `select c.uid as id, c.name as title, c.icon, (select count(r.id) from ${Tables.RESTAURANTS} r join ${Tables.RESTAURANT_CATEGORIES} rc on r.id =
            rc.id where rc.cat_id = c.id and r.status = ? and rc.status = ? ) as count from ${Tables.CATEGORIES} c where c.status = ? limit 5;`,
            values: [Status.one, Status.one, Status.one]
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findActiveCuisinesSearch(search_key) {
        const statement = {
            text: `select c.uid as id, c.name as title, c.icon, (select count(r.id) from ${Tables.RESTAURANTS} r join ${Tables.RESTAURANT_CATEGORIES} rc on r.id =
            rc.id where rc.cat_id = c.id and r.status = ? and rc.status = ? ) as count from ${Tables.CATEGORIES} c where c.status = ? and c.name like ? ;`,
            values: [Status.one, Status.one, Status.one, `%${search_key}%`]
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findActiveRestaurantByLocations() {
        const statement = {
            text: `SELECT l.uid AS id, l.name as title, l.icon,
            (SELECT COUNT(r.id) FROM ${Tables.RESTAURANTS} r WHERE r.location_id = l.id AND r.status = ?) AS count
            FROM ${Tables.LOCATION} l WHERE l.status = ? limit 5;`,
            values: [Status.one, Status.one]
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findActiveRestaurantByLocationsSearch(search_key) {
        const statement = {
            text: `SELECT l.uid AS id, l.name as title, l.icon,
            (SELECT COUNT(r.id) FROM ${Tables.RESTAURANTS} r WHERE r.location_id = l.id AND r.status = ?) AS count
            FROM ${Tables.LOCATION} l WHERE l.status = ? and l.name like ? ;`,
            values: [Status.one, Status.one, `%${search_key}%`]
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findActiveRestaurants() {
        const statement = {
            text: `SELECT r.uid AS id, r.name as title, r.icon, r.star_rating as rating,
            (select JSON_ARRAYAGG(c.name) from ${Tables.CATEGORIES} c join ${Tables.RESTAURANT_CATEGORIES} rc on rc.cat_id = c.id where rc.res_id = r.id and r.status = ? and rc.status = ?) as category,
            (select count(res.id) from ${Tables.RESERVATIONS} res where (res.status = ? or res.status is null) and res.res_id = r.id) as reservation_count,
            (select JSON_ARRAYAGG(JSON_OBJECT('start_time', TIME_FORMAT(sl.start_time, '%H:%i'), 'end_time', TIME_FORMAT(sl.end_time, '%H:%i'),'seats_left', sl.seats_left, 'discount', sl.discount)) from ${Tables.SLOTS} sl where sl.res_id = r.id and sl.date = CURDATE() and (sl.status = ? or sl.status is null)) as offer_list
            FROM ${Tables.RESTAURANTS} r WHERE r.status = ? limit 5;`,
            values: [Status.one, Status.one, Status.one, Status.one, Status.one]
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findActiveRestaurantsSearch(search_key) {
        const statement = {
            text: `SELECT r.uid AS id, r.name as title, r.icon, r.star_rating as rating,
            (select JSON_ARRAYAGG(c.name) from ${Tables.CATEGORIES} c join ${Tables.RESTAURANT_CATEGORIES} rc on rc.cat_id = c.id where rc.res_id = r.id and r.status = ? and rc.status = ?) as category,
            (select count(res.id) from ${Tables.RESERVATIONS} res where (res.status = ? or res.status is null) and res.res_id = r.id) as reservation_count,
            (select JSON_ARRAYAGG(JSON_OBJECT('start_time', TIME_FORMAT(sl.start_time, '%H:%i'), 'end_time', TIME_FORMAT(sl.end_time, '%H:%i'),'seats_left', sl.seats_left, 'discount', sl.discount)) from ${Tables.SLOTS} sl where sl.res_id = r.id and sl.date = CURDATE() and (sl.status = ? or sl.status is null)) as offer_list
            FROM ${Tables.RESTAURANTS} r WHERE r.status = ? and r.name like ?;`,
            values: [Status.one, Status.one, Status.one, Status.one, Status.one, `%${search_key}%`]
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async checkRestaurantId(restaurant_id) {
        const statement = {
            text: `Select count(*) as restaurant_count from ${Tables.RESTAURANTS} where uid = ? ;`,
            values: [restaurant_id]
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findActiveRestaurantByColumn(body) {
        const { column = 'uid', value = "" } = body;
        let text = `SELECT id, status, CAST(is_approved AS SIGNED) as is_approved  from ${Tables.RESTAURANTS} Where ${column} = ? AND status = ${Status.one};`
        const statement = {
            text,
            values: [value],
            rowsOnly: true,
        }
        const result = await db.query(statement);
        return result.rows;
    };

    static async findRestaurantById(uid, id = null, transaction) {
        const statement = {
            text: `select r.id, r.uid, r.location_id, r.commission_settled, r.type, CAST(is_approved AS SIGNED) as is_approved, r.other_details, r.status, r.on_boarded_by, r.approved_by, r.live_by, r.pilot_by, CAST(r.is_pilot AS SIGNED) is_pilot, mer_id from ${Tables.RESTAURANTS} r where r.uid = ? or r.id = ?;`,
            values: [uid, id],
            transaction
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findRestaurantIdByUIds(ids) {
        if (!Array.isArray(ids)) {
            ids = [ids];
        }
        const statement = {
            text: `select id, uid from ${Tables.RESTAURANTS} where id in (${inMapper(ids)});`,
            values: [],
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findRestaurantDetails(restaurant_id) {
        const statement = {
            text: `select
             r.uid as id, r.name as title, r.about, JSON_EXTRACT(r.image_urls, '$.menu_images') as menu,
            (select count(res.id) from ${Tables.RESERVATIONS} res where (res.status = ? or res.status is null) and res.res_id = r.id) as reservation_count, 
            (select JSON_ARRAYAGG(c.name) from ${Tables.CATEGORIES} c left join ${Tables.RESTAURANT_CATEGORIES} rc on c.id = rc.cat_id where rc.res_id = r.id and (rc.status = ? or rc.status is null) and (c.status = ? or c.status is null)) as category,
            (select JSON_ARRAYAGG(JSON_OBJECT('start_time', TIME_FORMAT(sl.start_time, '%H:%i'), 'end_time', TIME_FORMAT(sl.end_time, '%H:%i'),'seats_left', sl.seats_left, 'discount', sl.discount)) from ${Tables.SLOTS} sl where sl.res_id = r.id and sl.date = CURDATE() and (sl.status = ? or sl.status is null)) as offers_list,
            (select JSON_ARRAYAGG(JSON_OBJECT('name',am.name,'icon', am.icon)) from ${Tables.AMENITIES} am left join ${Tables.RESTAURANT_AMENITIES} ra on ra.amen_id = am.id where ra.res_id = r.id and (ra.status = ? or ra.status is null) and (am.status = ? or am.status is null) order by ra.id desc limit ${MAX_AMENITIES}) as amenities,
            (select JSON_ARRAYAGG(d.name) from ${Tables.DINNINGS} d left join ${Tables.RESTAURANT_DINNINGS} rd on d.id = rd.dinning_id where rd.res_id = r.id and (d.status = ? or d.status is null) and (rd.status = ? or rd.status is null)) as  dinning_options 
            FROM ${Tables.RESTAURANTS} r 
            WHERE r.uid = ? `,
            values: [Status.one, Status.one, Status.one, Status.one, Status.one, Status.one, Status.one, Status.one, restaurant_id]
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async getLatestRestaurantByMerchant(merId) {
        let text = `SELECT * from ${Tables.RESTAURANTS} Where mer_id = ? order by id desc limit 1;`;

        const statement = {
            text,
            values: [merId],
            rowsOnly: true,
        };

        const result = await db.query(statement);

        return result.rows;
    }

    static async getRestaurantReviewsDetailsList(data) {
        const { sort, offset, limit, is_paginated, keyword, from_date, to_date, id, type } = data;

        let condition = ``;
        const values = [];
        const countValues = [];

        let pagination = `ORDER BY r.${sort} LIMIT ${offset}, ${limit}`;
        if (!is_paginated) {
            pagination = `ORDER BY r.${sort}`;
        }

        if (!isEmptyField(keyword)) {
            condition += ` AND (r.uid LIKE ? OR r.name LIKE ? OR r.email LIKE ?)`;
            values.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
            countValues.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
        }
        if (!isEmptyField(from_date)) {
            condition += ` AND DATE_FORMAT(r.created_at,'%Y-%m-%d %H:%i:%s') >= ?`
            values.push(from_date);
            countValues.push(from_date);
        }
        if (!isEmptyField(to_date)) {
            condition += ` AND DATE_FORMAT(r.created_at,'%Y-%m-%d %H:%i:%s') <= ?`
            values.push(to_date);
            countValues.push(to_date);
        }
        if (!isEmptyField(id)) {
            condition += ` and r.uid = ?`
            values.push(id);
            countValues.push(id);
        }
        // if(!isEmptyField(type)){
        //     condition += ` and r.type = ?`
        //     values.push(type);
        //     countValues.push(type);
        // }

        const review_detail = `(SELECT JSON_OBJECT('avg_rating', AVG(rv.rating), 'review_count', COUNT(rv.id), 'review_reply_count', COUNT(NULLIF(rv.reply, ''))) FROM ${Tables.REVIEWS} rv WHERE rv.res_id = r.id AND rv.status = ${Status.one} GROUP BY rv.res_id) as reviews`

        const columns = `
        r.uid as id, 
        r.name,
        r.email,
        ${review_detail},
        CASE
           WHEN r.is_approved = ${Bit.one} THEN '${RestaurantApproval.APPROVED}'
           WHEN r.is_approved = ${Bit.zero} THEN '${RestaurantApproval.REJECTED}'
           ELSE '${RestaurantApproval.PENDING}'
        END AS approval_status`;

        const text = `SELECT ${columns} FROM ${Tables.MERCHANTS} m
        INNER JOIN ${Tables.RESTAURANTS} r ON m.id = r.mer_id
        WHERE 1 ${condition} ${pagination}`;

        const countText = `SELECT COUNT(m.id) as count FROM ${Tables.MERCHANTS} m
        INNER JOIN ${Tables.RESTAURANTS} r ON m.id = r.mer_id
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

    static async getRestaurantReviewsDetails(res_id) {
        const review_detail = `SELECT 
            AVG(rv.rating) as avg_rating, 
            COUNT(rv.id) as review_count, 
            COUNT(NULLIF(rv.reply, '')) as review_reply_count
            FROM ${Tables.REVIEWS} rv 
            INNER JOIN ${Tables.RESTAURANTS} r ON r.id = rv.res_id
            WHERE rv.res_id = ? AND rv.status = ${Status.one} GROUP BY rv.res_id`

        const statement = {
            text: review_detail,
            values: [res_id],
            rowsOnly: true
        };

        const result = await db.query(statement);

        return result.rows;
    }

    static async listSlots(body) {
        const { sort, limit, offset, keyword, is_paginated, from_date, to_date, id, type, res_id, day, month, year } = body;

        let condition = `WHERE 1`;
        const values = [];
        const countValues = [];

        let pagination = `ORDER BY ${sort} LIMIT ${offset}, ${limit}`;
        if (!is_paginated) {
            pagination = `ORDER BY ${sort}`;
        }

        if (!isEmptyField(from_date)) {
            condition += ` AND DATE_FORMAT(st.date,'%Y-%m-%d %H:%i:%s') >= ?`
            values.push(from_date);
            countValues.push(from_date);
        }

        if (!isEmptyField(to_date)) {
            condition += ` AND DATE_FORMAT(st.date,'%Y-%m-%d %H:%i:%s') <= ?`
            values.push(to_date);
            countValues.push(to_date);
        }

        if (!isEmptyField(id)) {
            condition += ` AND st.uid = ?`
            values.push(id);
            countValues.push(id);
        }

        if (!isEmptyField(res_id)) {
            condition += ` and st.res_id = ?`
            values.push(res_id);
            countValues.push(res_id);
        }

        if (!isEmptyField(day)) {
            condition += ` and DAY(st.date) = ?`
            values.push(day);
            countValues.push(day);
        }

        if (!isEmptyField(month)) {
            condition += ` and MONTH(st.date) = ?`
            values.push(month);
            countValues.push(month);
        }

        if (!isEmptyField(year)) {
            condition += ` and YEAR(st.date) = ?`
            values.push(year);
            countValues.push(year);
        }

        const statement = {
            text: `SELECT 
            st.uid as id, 
            SUBSTRING(st.start_time,1,5) AS start_time,
            SUBSTRING(st.end_time,1,5) AS end_time, 
            st.discount,
            st.seats_allocated,
            st.seats_left,
            st.max_guest_per_booking,
            st.status, 
            SUBSTRING(st.date,1,10) as date
            FROM ${Tables.SLOTS} st ${condition} ${pagination};`,
            values: values,
            rowsOnly: true,
        }

        const countText = `SELECT count(st.id) as count FROM ${Tables.SLOTS} st ${condition};`;

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
    }

    static async getBookingCounts(body) {
        const { res_id, filter = FilterCondnType.byDate, from_date, to_date } = body;

        const usrAdvPymtIncompleteBookArr = [BookingTrackStatus.payment_pending, BookingTrackStatus.auto_cancelled]
        const pastBookingArr = [BookingTrackStatus.cancelled, BookingTrackStatus.rejected, BookingTrackStatus.payment_completed, BookingTrackStatus.completed, BookingTrackStatus.noshow, BookingTrackStatus.booking_not_accepted, BookingTrackStatus.rejected_by_admin]
        const noShowBookingArr = [BookingTrackStatus.noshow]
        const acceptedBookingArr = [BookingTrackStatus.approved]
        const completedBookingArr = [BookingTrackStatus.payment_completed, BookingTrackStatus.completed]
        const cancelledBookingArr = [BookingTrackStatus.cancelled, BookingTrackStatus.rejected, BookingTrackStatus.rejected_by_admin]

        const upcoming_booking_condition = `rev.res_id = r.id AND sl.date >= CURDATE() AND rev.status not in (${pastBookingArr}) AND rev.status not in (${usrAdvPymtIncompleteBookArr})`;
        const completed_booking_condition = `rev.res_id = r.id AND rev.status in (${completedBookingArr})`;
        const cancelled_booking_condition = `rev.res_id = r.id AND rev.status in (${cancelledBookingArr})`;
        const noshow_booking_condition = `rev.res_id = r.id AND rev.status in (${noShowBookingArr})`;
        const accepted_booking_condition = `rev.res_id = r.id AND rev.status in (${acceptedBookingArr})`;

        // const commonQuery = `SELECT COUNT(rev.id) FROM ${Tables.RESERVATIONS} rev INNER JOIN ${Tables.SLOTS} sl ON sl.id = rev.slot_id INNER JOIN ${Tables.PAYMENTS} pm ON pm.reservation_id = rev.id AND pm.status = ${PaymentStatus.completed.value} WHERE`
        const commonQuery = `SELECT COUNT(rev.id) FROM ${Tables.RESERVATIONS} rev INNER JOIN ${Tables.SLOTS} sl ON sl.id = rev.slot_id WHERE`
        const upcoming_booking_count = `(${commonQuery} ${upcoming_booking_condition}) as upcoming_booking_count`
        const completed_booking_count = `(${commonQuery} ${completed_booking_condition} ${RestaurantsModel.getFilterCondn({ tblName: 'sl', columnName: 'date', filter, from_date, to_date })}) AS completed_booking_count`
        const cancelled_booking_count = `(${commonQuery} ${cancelled_booking_condition} ${RestaurantsModel.getFilterCondn({ tblName: 'sl', columnName: 'date', filter, from_date, to_date })}) AS cancelled_booking_count`
        const total_booking_count = `(${commonQuery} rev.res_id = r.id ${RestaurantsModel.getFilterCondn({ tblName: 'sl', columnName: 'date', filter, from_date, to_date })}) AS total_booking_count`
        const noshow_booking_count = `(${commonQuery} ${noshow_booking_condition} ${RestaurantsModel.getFilterCondn({ tblName: 'sl', columnName: 'date', filter, from_date, to_date })}) AS noshow_booking_count`
        const accepted_booking_count = `(${commonQuery} ${accepted_booking_condition} ${RestaurantsModel.getFilterCondn({ tblName: 'sl', columnName: 'date', filter, from_date, to_date })}) AS accepted_booking_count`

        const text = `SELECT 
            ${upcoming_booking_count},
            ${completed_booking_count},
            ${cancelled_booking_count},
            ${total_booking_count},
            ${noshow_booking_count},
            ${accepted_booking_count}
          FROM 
            ${Tables.RESTAURANTS} r  
          WHERE 
            r.id = ?;`


        const statement = {
            text,
            values: [res_id],
            rowsOnly: true,
        };
        const result = await db.query(statement);
        return result.rows;
    }

    static getFilterCondn(filterData) {
        const { tblName, columnName = 'created_at', filter, from_date, to_date } = filterData;
        let filterCondn = ``;
        if (filter === FilterCondnType.history) {
            filterCondn = ``;
        } else if (filter === FilterCondnType.three_months) {
            filterCondn = ` AND DATE_FORMAT(${tblName}.${columnName},'%Y-%m-%d %H:%i:%s') >= DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL -3 MONTH),'%Y-%m-%d %H:%i:%s')`
            // WHERE Date_Column >= DATEADD(MONTH, -3, GETDATE()) 
        } else if (filter === FilterCondnType.today) {
            filterCondn = ` AND DATE_FORMAT(${tblName}.${columnName},'%Y-%m-%d %H:%i:%s') = DATE_FORMAT(CURDATE(),'%Y-%m-%d %H:%i:%s')`
        } else if (filter === FilterCondnType.byDate) {
            if (!isEmptyField(from_date)) {
                filterCondn += ` AND DATE_FORMAT(${tblName}.${columnName},'%Y-%m-%d %H:%i:%s') >= '${from_date}'`
            }
            if (!isEmptyField(to_date)) {
                filterCondn += ` AND DATE_FORMAT(${tblName}.${columnName},'%Y-%m-%d %H:%i:%s') <= '${to_date}'`
            }
        }
        return filterCondn;
    }

    static async getRestaurantDetails(body) {
        const { column = "id", value = "" } = body;

        const rcolumns = `
        r.id, 
        r.uid,
        r.name, 
        r.country_code, 
        r.phone,
        r.landline_country_code, 
        r.landline_std_code, 
        r.landline,  
        r.email,
        CAST(r.is_mobile_verified AS SIGNED) as is_mobile_verified, 
        CAST(r.is_email_verified AS SIGNED) as is_email_verified, 
        r.mer_id, 
        JSON_OBJECT(
          'is_mobile_verified', CAST(merch.is_mobile_verified AS SIGNED), 
          'is_email_verified', CAST(merch.is_email_verified AS SIGNED),
          'email',merch.email, 
          'mobile', merch.mobile) as merchant,
        r.coordinates, 
        r.address, 
        r.gps_address,
        r.pincode as pin_code,
        r.icon, 
        r.image_urls, 
        r.about,
        r.type, 
        r.policy, 
        CAST(r.is_approved AS SIGNED) as is_approved,
        r.other_details, 
        r.total_seats, 
        r.total_restaurant_capacity, 
        r.max_guest_per_slot,
        r.max_guest_per_booking, 
        r.auto_booking,
        r.commission_base_price,
        r.commission_advance`;
        const category = `(SELECT COUNT(c.id) FROM ${Tables.CATEGORIES} c JOIN ${Tables.RESTAURANT_CATEGORIES} rc on rc.cat_id = c.id WHERE rc.res_id = r.id) AS category`;
        const amenities = `(SELECT COUNT(a.id) FROM ${Tables.AMENITIES} a JOIN ${Tables.RESTAURANT_AMENITIES} ram on ram.amen_id = a.id WHERE ram.res_id = r.id) AS amenities`;
        // const dinnings = `(SELECT COUNT(d.uid) FROM ${Tables.DINNINGS} d JOIN ${Tables.RESTAURANT_DINNINGS} rdn on rdn.dinning_id = d.id WHERE rdn.res_id = r.id) as dinnings`;
        const slots = `(SELECT COUNT(sl.id) FROM ${Tables.SLOTS} sl WHERE sl.res_id = r.id AND (sl.status <> 0 or sl.status IS NULL)) AS slots`;
        const operational_hours = `(SELECT COUNT(oph.id) FROM ${Tables.RESTAURANT_OPERATIONAL_HOURS} oph WHERE oph.res_id = r.id) AS operational_hours`;

        const country = `(SELECT country.name FROM ${Tables.COUNTRIES} country WHERE country.id = r.country_id) AS country`;
        const city = `(SELECT city.name FROM ${Tables.CITIES} city WHERE city.id = r.city_id) AS city`;
        const location = `(SELECT location.uid FROM ${Tables.LOCATION} location WHERE location.id = r.location_id) AS location`;

        let text = `SELECT 
            ${rcolumns},
            ${category},
            ${amenities},
            ${slots},
            ${country},
            ${city},
            ${location},
            ${operational_hours}
          FROM ${Tables.RESTAURANTS} r 
          LEFT JOIN ${Tables.MERCHANTS} merch ON r.mer_id = merch.id WHERE ${column} = ?`;

        const statement = {
            text,
            values: [value],
            rowsOnly: true,
        };
        const result = await db.query(statement);
        return result.rows;
    }

    static async getLatestRestaurantByMerchant(merId) {
        let text = `SELECT id, uid, mer_id, status, max_guest_per_slot, max_guest_per_booking, coalesce(JSON_EXTRACT(image_urls, '$.logo_images'),JSON_ARRAY()) as logo_images, name, CAST(is_mobile_verified AS SIGNED) as is_mobile_verified, phone, CAST(is_pilot AS SIGNED) AS is_pilot from ${Tables.RESTAURANTS} Where mer_id = ? order by created_at desc limit 1;`;
        const statement = {
            text,
            values: [merId],
            rowsOnly: true,
        };

        const result = await db.query(statement);
        return result.rows;
    }

    static async getDataById(id, transaction = null) {
        if (!id)
            return []
        const statement = {
            text: `SELECT 
                    rt.id, 
                    rt.uid,
                    rt.name
                FROM ${Tables.RESTAURANTS} rt
                WHERE rt.id = ?;`,
            values: [id],
            transaction
        }
        const result = await db.query(statement);
        return result.rows;
    }
}

module.exports = RestaurantsModel;
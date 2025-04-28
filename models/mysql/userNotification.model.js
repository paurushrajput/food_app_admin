const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Bit, Status } = require("../../constants/database");

class UserNotification {

    static async insert(notifications) {
        const statement = { ...insertData(Tables.USER_NOTIFICATION, notifications), operation: Operations.INSERT };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows inserted into ${Tables.USER_NOTIFICATION} table `
        };
    }

    static async pushReadNotification(notificationIds, id) {
        let text = `UPDATE ${Tables.USER_NOTIFICATION} set read_ids = JSON_ARRAY_APPEND(read_ids,'$',?) WHERE id = ? `;
        let values = [notificationIds, id];
        if (Array.isArray(notificationIds)) {
            text = `UPDATE ${Tables.USER_NOTIFICATION} SET read_ids = JSON_MERGE(read_ids, JSON_ARRAY(${inMapper(notificationIds)})) WHERE id = ? ; `
            values = [id];
        }

        const statement = {
            text,
            values,
            rowsOnly: true,
        }

        const result = await db.query(statement);
        return result.rows;
    }

    static async checkIfNotificationAlreadyRead(user_id, notification_id) {
        const statement = {
            text: `select un.id, count(un.read_ids) as read_count from (SELECT j.read_ids, id FROM ${Tables.USER_NOTIFICATION} AS u JOIN JSON_TABLE(u.read_ids, "$[*]" COLUMNS (read_ids INT PATH "$")) AS j WHERE u.user_id = ? AND deleted_at IS NULL) as un where ? in (un.read_ids) group by un.id;`,
            values: [user_id, notification_id],
            rowsOnly: true,
        }

        const result = await db.query(statement);
        return result.rows;
    }

    static async findIdForUser(user_id) {
        const statement = {
            text: `SELECT id, uid FROM ${Tables.USER_NOTIFICATION} where user_id =  ? ;`,
            values: [user_id],
            rowsOnly: true,
        }

        const result = await db.query(statement);
        return result.rows;
    }

    static async getAllNotification(data) {
        const { user_id, sort_by, order, offset, limit, is_paginated } = data;

        const columns = ` nm.uid as id, nm.topic, nm.title, (UNIX_TIMESTAMP(coalesce(nm.updated_at, nm.created_at)) * 1000) as date, nm.device_type, nm.type, CONCAT(m.basePath, '/', m.filename) as image, coalesce(nm.message,'') as message, coalesce(nm.html_description,'') as html_description, coalesce(nm.description,'') as description,
        coalesce(nm.action_url,'') as action_url, coalesce(nm.action_type,'') as action_type, coalesce(nm.action_button_name,'') as action_button_name, notification_read.read_ids, 
        CASE 
          WHEN nm.id IN (SELECT j.read_ids FROM ${Tables.USER_NOTIFICATION} AS u 
            JOIN JSON_TABLE(u.read_ids, "$[*]" COLUMNS (read_ids INT PATH "$")) AS j WHERE u.user_id = 1 AND u.deleted_at IS NULL) THEN 1 
          ELSE 0 
        END AS is_read `;

        let condition = ` deleted_at IS NULL AND (user_id = ? OR user_id IS NULL) `;
        const sort = ` nm.${sort_by} ${order} `;
        let pagination = `order by ${sort} limit ${offset}, ${limit}`;

        const values = [user_id, user_id];
        const countValues = [user_id, user_id];

        if (!is_paginated || is_paginated === "" || is_paginated.toString() === 'false') {
            pagination = ``;
        }

        const text = `SELECT n.*, 
        CASE 
          WHEN n.read_ids is null then 0
          ELSE 1
        END as  is_read FROM (SELECT ${columns} FROM ${Tables.NOTIFICATION_MASTER} nm LEFT JOIN media m ON nm.image = m.id LEFT JOIN ( SELECT j.read_ids FROM ${Tables.USER_NOTIFICATION} AS u JOIN JSON_TABLE(u.read_ids, "$[*]" COLUMNS (read_ids INT PATH "$")) AS j WHERE u.user_id = ? AND deleted_at IS NULL ) notification_read ON nm.id = notification_read.read_ids WHERE ${condition} ${pagination}) n order by n.read_ids DESC`;

        const countText = ` SELECT COUNT(nm.id) as count FROM ${Tables.NOTIFICATION_MASTER} nm LEFT JOIN media m ON nm.image = m.id LEFT JOIN ( SELECT j.read_ids FROM ${Tables.USER_NOTIFICATION} AS u JOIN JSON_TABLE(u.read_ids, "$[*]" COLUMNS (read_ids INT PATH "$")) AS j WHERE u.user_id = ? AND deleted_at IS NULL ) notification_read ON nm.id = notification_read.read_ids WHERE ${condition} ${pagination} `;

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
    }

    static async getNonUserSpecificNotification(data) {
        const { sort_by, order, offset, limit, is_paginated } = data;

        const columns = ` 
        nm.uid as id, 
        nm.topic, 
        nm.title, 
        (UNIX_TIMESTAMP(coalesce(nm.updated_at, nm.created_at)) * 1000) as date, 
        nm.device_type, nm.type, 
        CONCAT(m.basePath, '/', m.filename) as image, 
        coalesce(nm.message,'') as message, 
        coalesce(nm.html_description,'') as html_description, 
        coalesce(nm.description,'') as description,
        coalesce(nm.action_url,'') as action_url, 
        coalesce(nm.action_type,'') as action_type, 
        coalesce(nm.action_button_name,'') as action_button_name, 
        r.uid AS restaurant_id, 
        r.name AS res_name`;

        let condition = ` nm.deleted_at IS NULL AND user_id IS NULL `;
        const sort = ` nm.${sort_by} ${order} `;
        let pagination = `order by ${sort} limit ${offset}, ${limit}`;

        const values = [];
        const countValues = [];

        if (!is_paginated || is_paginated === "" || is_paginated.toString() === 'false') {
            pagination = ``;
        }

        const text = `SELECT ${columns} 
        FROM ${Tables.NOTIFICATION_MASTER} nm 
        LEFT JOIN media m ON nm.image = m.id
        LEFT JOIN ${Tables.RESTAURANTS} r ON nm.res_id = r.id 
        WHERE ${condition} ${pagination}`;

        const countText = ` SELECT COUNT(nm.id) as count FROM ${Tables.NOTIFICATION_MASTER} nm LEFT JOIN media m ON nm.image = m.id WHERE ${condition} `;

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
    }

    static async getAllUnreadNotification(user_id) {
        const statement = {
            text: `select nm.uid as id, nm.topic, nm.title, nm.device_type, nm.type, CONCAT(m.basePath,'/',m.filename) as image, nm.user_id, nm.message, nm.html_description, nm.description, nm.action_url, nm.action_type, nm.action_button_name from ${Tables} nm left join ${Tables.MEDIA} m on nm.image = m.id where deleted_at is null and (user_id = ? OR nm.user_id is null) and nm.id NOT IN (SELECT j.read_ids FROM ${Tables.USER_NOTIFICATION}} AS u JOIN JSON_TABLE( u.read_ids, "$[*]" COLUMNS ( read_ids INT PATH "$" ) ) AS j WHERE u.user_id = ?) order by nm.id desc;`,
            values: [user_id, user_id],
            rowsOnly: true,
        }

        const result = await db.query(statement);
        return result.rows;
    }

    static async updateOneById(columns, id) {
        const statement = { ...updateSingle(Tables.USER_NOTIFICATION, columns, id), operation: Operations.UPDATE };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows updated into ${Tables.USER_NOTIFICATION} table`
        };
    }
}

module.exports = UserNotification;
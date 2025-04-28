const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations } = require("../../constants/database");

class NotificationTemplateModel {

    static async insert(template) {
        const statement = { ...insertData(Tables.NOTIFICATION_TEMPLATE, template), operation: Operations.INSERT };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows inserted into ${Tables.NOTIFICATION_TEMPLATE} table`
        };
    }

    static async updateOneById(columns, id) {
        const statement = { ...updateSingle(Tables.NOTIFICATION_TEMPLATE, columns, id), operation: Operations.UPDATE };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows updated into ${Tables.NOTIFICATION_TEMPLATE} table`
        };
    }

    static async findOneById(id) {
        const statement = {
            text: `SELECT nt.id, nt.uid, nt.keyword, nt.title, nt.message, nt.other_details, CONCAT(m.basePath,'/',m.filename) as image, COALESCE(nt.updated_at, nt.created_at) AS modified_at FROM ${Tables.NOTIFICATION_TEMPLATE} nt left join ${Tables.MEDIA} m on nt.image_id = m.id where nt.id = ? and nt.deleted_at is null;`,
            values: [id],
        }
        const result = await db.query(statement);
        return result.rows
    }

    static async findOneByuId(uid) {
        const statement = {
            text: `SELECT nt.id, nt.uid, nt.keyword, nt.title, nt.message, nt.other_details, CONCAT(m.basePath,'/',m.filename) as image, COALESCE(nt.updated_at, nt.created_at) AS modified_at FROM ${Tables.NOTIFICATION_TEMPLATE} nt left join ${Tables.MEDIA} m on nt.image_id = m.id where nt.uid = ? and nt.deleted_at is null;`,
            values: [uid],
        }
        const result = await db.query(statement);
        return result.rows
    }

    static async findOneByKeyword(keyword, transaction = null) {
        const statement = {
            text: `SELECT nt.id, nt.uid, nt.keyword, nt.title, nt.message, nt.other_details, CONCAT(m.basePath,'/',m.filename) as image, COALESCE(nt.updated_at, nt.created_at) AS modified_at FROM ${Tables.NOTIFICATION_TEMPLATE} nt left join ${Tables.MEDIA} m on nt.image_id = m.id where nt.keyword = ? and nt.deleted_at is null;`,
            values: [keyword],
            transaction
        }
        const result = await db.query(statement);
        return result.rows
    }

    static async listNotificationTemplate(body) {
        const { sort, offset, limit, is_paginated, search_key } = body;
        const columns = `nt.uid, nt.keyword, nt.title, nt.message, nt.other_details, CONCAT(m.basePath,'/',m.filename) as image, COALESCE(nt.updated_at, nt.created_at) AS modified_at `
        let condition = ` nt.deleted_at is NULL `;
        let pagination = `order by ${sort} limit ${offset}, ${limit}`;

        const values = [];
        const countValues = [];

        if (!is_paginated || is_paginated.toString() === 'false') {
            pagination = `order by ${sort}`
        }

        if (search_key && search_key !== "") {
            condition += ` AND (LOWER(nt.keyword) LIKE LOWER (?)  OR  LOWER(nt.title) LIKE LOWER (?) OR LOWER(nt.message) LIKE LOWER (?))`
            values.push(`%${search_key}%`);
            values.push(`%${search_key}%`);
            values.push(`%${search_key}%`);
            countValues.push(`%${search_key}%`);
            countValues.push(`%${search_key}%`);
            countValues.push(`%${search_key}%`);
        }

        const text = `SELECT ${columns} FROM ${Tables.NOTIFICATION_TEMPLATE} nt left join ${Tables.MEDIA} m on nt.image_id = m.id WHERE ${condition} ${pagination}`;
        const countText = `SELECT Count(nt.id) as count from ${Tables.NOTIFICATION_TEMPLATE} nt left join ${Tables.MEDIA} m on nt.image_id = m.id WHERE ${condition}`;

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

module.exports = NotificationTemplateModel;
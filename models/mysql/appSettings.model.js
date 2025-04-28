const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations } = require("../../constants/database");

class AppSettingsModel {

    static async insert(appSetting) {
        const statement = { ...insertData(Tables.APP_SETTINGS, appSetting), operation: Operations.INSERT };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows inserted into ${Tables.APP_SETTINGS} table`
        };
    }

    static async findMaxRank() {
        const statement = {
            text: `SELECT COALESCE(max(sequence), 0) AS sequence FROM ${Tables.APP_SETTINGS} where deleted_at is null;`,
            values: [],
        }
        const result = await db.query(statement);
        return result.rows
    }

    static async updateOneById(columns, id) {
        const statement = { ...updateSingle(Tables.APP_SETTINGS, columns, id), operation: Operations.UPDATE };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows updated into ${Tables.APP_SETTINGS} table`
        };
    }

    static async findOneByuId(uid) {
        const statement = {
            text: `SELECT aps.id, aps.uid, aps.title, CONCAT(m.basePath,'/',m.filename) as image, aps.description, aps.url, aps.sequence FROM ${Tables.APP_SETTINGS} aps left join ${Tables.MEDIA} m on aps.image = m.id where aps.uid = ? and aps.deleted_at is null;`,
            values: [uid],
        }
        const result = await db.query(statement);
        return result.rows
    }

    static async findOneById(id) {
        const statement = {
            text: `SELECT aps.id, aps.uid, aps.title, CONCAT(m.basePath,'/',m.filename) as image, aps.description, aps.url, aps.sequence FROM ${Tables.APP_SETTINGS} aps left join ${Tables.MEDIA} m on aps.image = m.id where aps.id = ? and aps.deleted_at is null;`,
            values: [id],
        }
        const result = await db.query(statement);
        return result.rows
    }

    static async listSettings(body) {
        const { sort, offset, limit, is_paginated, title } = body;
        const columns = `aps.uid as id, aps.title, aps.alternate_id, CONCAT(m.basePath,'/',m.filename) as image,  aps.description, aps.url, aps.sequence `
        let condition = ` aps.deleted_at is NULL `;
        let pagination = `order by ${sort} limit ${offset}, ${limit}`;

        const values = [];
        const countValues = [];

        if (!is_paginated || is_paginated.toString() === 'false') {
            pagination = `order by ${sort}`
        }

        if (title && title !== "") {
            condition += ` AND LOWER(aps.title) LIKE LOWER (?)`
            values.push(`%${title}%`);
            countValues.push(`%${title}%`);
        }

        const text = `SELECT ${columns} FROM ${Tables.APP_SETTINGS} aps left join ${Tables.MEDIA} m on aps.image = m.id WHERE ${condition} ${pagination}`;
        const countText = `SELECT Count(aps.id) as count from ${Tables.APP_SETTINGS} aps left join ${Tables.MEDIA} m on aps.image = m.id WHERE ${condition}`;

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

    static async checkIfIdsExist(uids) {
        if (!Array.isArray(uids)) {
            uids = [uids];
        }
        const statement = {
            text: `SELECT uid, id FROM ${Tables.APP_SETTINGS} where uid IN (${inMapper(uids)});`,
            values: [],
        }
        const result = await db.query(statement);
        return result.rows
    }

}

module.exports = AppSettingsModel;
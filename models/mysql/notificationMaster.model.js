const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Bit, Status } = require("../../constants/database");

class NotificationMaster {

    static async insert(notifications, transaction = null) {
        const statement = { ...insertData(Tables.NOTIFICATION_MASTER, notifications), operation: Operations.INSERT, transaction };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows inserted into ${Tables.NOTIFICATION_MASTER} table`
        };
    }

    static async updateOneById(columns, id) {
        const statement = { ...updateSingle(Tables.NOTIFICATION_MASTER, columns, id), operation: Operations.UPDATE };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows updated into ${Tables.NOTIFICATION_MASTER} table`
        };
    }

    static async findOneByUid(uid) {
        const statement = {
            text: `SELECT id, uid, topic, title, message FROM ${Tables.NOTIFICATION_MASTER} where uid = ? and deleted_at is null `,
            values: [uid]
        }
        const result = await db.query(statement);
        return result.rows;
    }
}

module.exports = NotificationMaster;
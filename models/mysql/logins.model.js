const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations } = require("../../constants/database");

class LoginsModel {

    static async insert(logins) {
        const statement = { ...insertData(Tables.LOGINS, logins), operation: Operations.INSERT };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows inserted into ${Tables.LOGINS} table`
        };
    }

    static async updateOneById(columns, id) {
        const statement = { ...updateSingle(Tables.LOGINS, columns, id), operation: Operations.UPDATE };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows updated into ${Tables.LOGINS} table`
        };
    }

    static async findLastOtpSentByMobile(country_code, mobile) {
        const statement = {
            text: `select id, otp, device_type, COALESCE (otp_attempt, 0) as otp_attempt, COALESCE (success, 0) as success from ${Tables.LOGINS} where country_code = ? and mobile = ?  and otp is not null order by id desc limit 1;`,
            values: [country_code, mobile],
        }
        const result = await db.query(statement);
        return result.rows;
    }
}

module.exports = LoginsModel;
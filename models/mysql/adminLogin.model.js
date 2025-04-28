const { db, insertData} = require("../../dbConfig/dbConnect");
const { Tables, Operations} = require("../../constants/database");

class AdminLoginModel {
    static async insert(adminLogin, transaction) {
        const statement = { ...insertData(Tables.ADMIN_LOGINS, adminLogin), operation: Operations.INSERT, transaction };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows inserted into ${Tables.ADMIN_LOGINS} table`
        };
    }
}

module.exports = AdminLoginModel;
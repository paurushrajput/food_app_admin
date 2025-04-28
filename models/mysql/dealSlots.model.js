const { db, insertData, updateSingle, updateByColumn } = require("../../dbConfig/dbConnect");
const { Tables, Operations } = require("../../constants/database");

class DealSlotModel {
    static async insert(dealSlot, transaction) {
        const statement = { ...insertData(Tables.DEAL_SLOT, dealSlot), operation: Operations.INSERT, transaction };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows inserted into ${Tables.DEAL_SLOT} table`
        };
    }

    static async updateOneById(columns, id) {
        const statement = { ...updateSingle(Tables.DEAL_SLOT, columns, id), operation: Operations.UPDATE };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows updated into ${Tables.DEAL_SLOT} table`
        };
    }

    static async updateByColumn(columns, byColumn, columnValue, transaction = null) {
        const statement = { ...updateByColumn(Tables.DEAL_SLOT, columns, byColumn, columnValue), operation: Operations.UPDATE, transaction };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows updated into ${Tables.DEAL_SLOT} table`
        };
    }

    static async deleteSlotsByDealId(dealId, transaction) {
        const statement = {
            text: `DELETE from ${Tables.DEAL_SLOT} where deal_id = ?;`,
            values: [dealId],
            transaction
        }
        const result = await db.query(statement);
        return result.rows;
    }
}

module.exports = DealSlotModel;
const { db, inMapper, insertData, updateSingle, updateMultiple } = require("../../dbConfig/dbConnect");
const { Tables, Operations } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");

class UserPointsModel {
    
    static async insert(userPoints, transaction) {
        console.log("userPoints", userPoints)
        const statement = { ...insertData(Tables.USER_POINTS, userPoints), operation: Operations.INSERT, transaction };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows inserted into ${Tables.USER_POINTS} table`
        };
    }

    static async updateOneById(columns, id) {
        const statement = { ...updateSingle(Tables.USER_POINTS, columns, id), operation: Operations.UPDATE };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
            rows: affectedRows,
            msg: `${affectedRows} rows updated into ${Tables.USER_POINTS} table`
        };
    }

    static async updateManyById(columns, ids, transaction = null) {
        const statement = { ...updateMultiple(Tables.USER_POINTS, columns, ids), operation: Operations.UPDATE, transaction };
        const result = await db.query(statement);
        const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
        return {
          rows: affectedRows,
          msg: `${affectedRows} rows updated into ${Tables.USER_POINTS} table`
        };
    }

    static async getAllByColumnsByInQuery(body, transaction = null) {
        const {columns = ['id'], values = [""]} = body;
        let columnsString = ``
        columns.map((el, index)=> {
          columnsString += `up.${el} IN (${inMapper(values[index])}) AND `
        })
    
        const columnsStringLastIndex = columnsString.trim().lastIndexOf('AND');
        columnsString = columnsString.substr(0, columnsStringLastIndex);
    
        let text = `SELECT up.id, up.uid, up.user_id
        FROM ${Tables.USER_POINTS} up
        WHERE ${columnsString};`
    
        const statement = {
          text,
          values: [...values],
          rowsOnly: true,
          transaction
        }
    
        const result = await db.query(statement);
    
        return result.rows;
    };
}

module.exports = UserPointsModel;
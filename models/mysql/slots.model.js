const { db, inMapper, insertData, updateSingle, updateByColumn } = require("../../dbConfig/dbConnect");
const { Tables, Operations } = require("../../constants/database");

class SlotModel {
  /**
   * get a slot by id
   * @param {string} body
   */
  static async getByID(body) {
    const { column = "id", value = "", res_id = "" } = body;
    let values = [value];
    let etr_cond = "";
    if (res_id) {
      etr_cond = " AND res_id = ?"
      values.push(res_id)
    }
    let text = `SELECT id, seats_left, start_date, start_time, discount from ${Tables.SLOTS} Where ${column} = ? ${etr_cond} AND status = 1;`

    const statement = {
      text,
      values: values,
      rowsOnly: true,
    }

    const result = await db.query(statement);
    return result.rows;
  }

  static async updateOneByID(columns, id, transaction = null) {
    const statement = { ...updateSingle(Tables.SLOTS, columns, id), operation: Operations.UPDATE, transaction };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.SLOTS} table`
    };
  }

  static async updateByColumn(columns, byColumn, value, transaction = null) {
    const statement = { ...updateByColumn(Tables.SLOTS, columns, byColumn, value), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.SLOTS} table`
    };
  }

  static async updateManyById(columns, ids) {
    const statement = { ...updateMultiple(Tables.SLOTS, columns, ids), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.SLOTS} table`
    };
  }

  static async findSlotAndBookingDetailsByStartAndEndDate(restaurantId, startDate, endDate, startTime, endTime, status, transaction) {
    let text = `SELECT s.id, s.date, s.start_time, s.end_time, s.other_details, s.pax_details,
    (SELECT JSON_ARRAYAGG(r.id) FROM ${Tables.RESERVATIONS} r WHERE  r.slot_id = s.id and r.status IN (${inMapper(status)})) AS booking_details
    FROM ${Tables.SLOTS} s WHERE s.res_id = ? AND DATE_FORMAT(s.date,'%Y-%m-%d') >= ? AND DATE_FORMAT(s.date,'%Y-%m-%d') <= ? AND s.start_time >= ?
    AND s.end_time <= ? ;`;
    const statement = {
      text,
      values: [restaurantId, startDate, endDate, startTime, endTime],
      rowsOnly: true,
      transaction
    };

    const result = await db.query(statement);
    return result.rows;
  }
}

module.exports = SlotModel;
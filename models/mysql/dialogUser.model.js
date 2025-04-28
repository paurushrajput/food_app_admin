const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, Status } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");

class DialogUserModel {

  static async insert(dialog, transaction) {
    const statement = {
      ...insertData(Tables.DIALOG_USER, dialog), operation: Operations.INSERT, transaction
    };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.DIALOG} table`
    };
  }

  static async deleteUserDialogByIds(userIds, dialogId, transaction) {
    if (!Array.isArray(userIds)) {
      userIds = [userIds]
    }
    const statement = {
      text: `DELETE FROM ${Tables.DIALOG_USER} WHERE user_id IN (${inMapper(userIds)}) AND dialog_id = ? ;`,
      values: [dialogId],
      transaction
    }
    const result = await db.query(statement);
    return result.rows
  }

}

module.exports = DialogUserModel;
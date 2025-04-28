const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, CouponStatus } = require("../../constants/database");

class OrganizationModel {

  static async insert(organization) {
    const statement = { ...insertData(Tables.ORGANIZATIONS, organization), operation: Operations.INSERT };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.ORGANIZATIONS} table`
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.ORGANIZATIONS, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.ORGANIZATIONS} table`
    };
  }

  static async findOneByuId(uid) {
    const statement = {
      text: `SELECT id, uid, name, domain, subdomain, status FROM ${Tables.ORGANIZATIONS} where uid = ? and deleted_at is null ;`,
      values: [uid],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async findOneById(id) {
    const statement = {
      text: `SELECT id, uid, name, domain, subdomain, status FROM ${Tables.ORGANIZATIONS} where id = ? and deleted_at is null ;`,
      values: [id],
    }
    const result = await db.query(statement);
    return result.rows
  }

  static async getOrganizationList() {
    const statement = {
      text: `SELECT uid as id, name, domain, subdomain, status FROM ${Tables.ORGANIZATIONS} where deleted_at IS NULL;`,
      values: [],
    }
    const result = await db.query(statement);
    return result.rows
  }

}

module.exports = OrganizationModel;
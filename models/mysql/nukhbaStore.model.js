const {
  db,
  inMapper,
  insertData,
  updateSingle,
} = require("../../dbConfig/dbConnect");
const {
  Tables,
  Operations,
  CouponStatus,
} = require("../../constants/database");

class NukhbaStoreModel {
  static async insert(payload) {
    const statement = {
      ...insertData(Tables.NUKHBA_STORE, payload),
      operation: Operations.INSERT,
    };
    const result = await db.query(statement);
    const affectedRows = Number(
      JSON.parse(JSON.stringify(result))?.rows?.affectedRows
    );
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows inserted into ${Tables.NUKHBA_STORE} table`,
    };
  }

  static async updateOneById(columns, id) {
    const statement = { ...updateSingle(Tables.NUKHBA_STORE, columns, id), operation: Operations.UPDATE };
    const result = await db.query(statement);
    const affectedRows = Number(JSON.parse(JSON.stringify(result))?.rows?.affectedRows);
    return {
      rows: affectedRows,
      msg: `${affectedRows} rows updated into ${Tables.COUPONS} table`
    };
  }

  static async findOneByTitle(title) {
    let condition = ` WHERE title=? AND deleted_at is null`
    const statement = {
      text: `SELECT id,title FROM ${Tables.NUKHBA_STORE} ${condition} ;`,
      values: [title],
    };
    const result = await db.query(statement);
    return result.rows;
  }

  static async findAll({sort}) {
    let condition=' WHERE ns.deleted_at is null'
    if(sort){
      condition +=` ORDER BY ${sort}`
    }

    let valueArr= []

    
    const statement = {
      text: `SELECT ns.uid as id,ns.title,ns.description,ns.type,c.uid as coupon_id,ns.image_id,CONCAT(m.basePath,'/',m.filename) as image,  ns.points, ns.status FROM ${Tables.NUKHBA_STORE} ns left join ${Tables.MEDIA} m on ns.image_id = m.id left join ${Tables.COUPONS} c on ns.coupon_id = c.id  ${condition} ;`,
      values: [],
    };
    const result = await db.query(statement);
    return {
      rows: result?.rows,
      count:result?.rows?.length,
    } ;
  }

  static async deleteByUid(uid) {
    const statement = {
      text: `DELETE FROM ${Tables.NUKHBA_STORE} WHERE uid=? ;`,
      values: [uid],
    };
    const result = await db.query(statement);
    return result.rows
  }

  static async findOneByUID(uid) {
    const statement = {
      text: `SELECT id, uid,title,description,type,coupon_id,image_id,points, status FROM ${Tables.NUKHBA_STORE} where uid = ? and deleted_at is null ;`,
      values: [uid],
    }
    const result = await db.query(statement);
    return result.rows
  }


}

module.exports = NukhbaStoreModel;

const DeletedUserModel = require("../../models/mysql/deletedUsers.model.js");
const MediaModel = require("../../models/mysql/media.model");
const ClientError = require("../../error/clientError");
const {checkMandatoryFields, isEmptyField, getTrimmedValue} = require("../../utils/common.js");
const { mandatoryFieldErrorCode } = require("../../constants/statusCode");
const { getUrlFromBucket } = require("../../utils/s3");
const { encrypt, decrypt } = require("../../utils/encryption");
const { deleteApp } = require("firebase-admin/app");

class DeletedUserService {
  /**
  * list deleted user
  * @param {string} body - pagination values.
  */
  static async get(body) {
    let {
      page = 1,
      page_size = 10,
      is_paginated = true,
      sort_by = 'created_at',
      order = 'desc',
      keyword,
      from_date,
      to_date,
      id,
      type,
      user,
    } = body;
    

    if(isEmptyField(sort_by)) sort_by = 'created_at';
    if(isEmptyField(order)) order = 'desc';
    if(isEmptyField(page)) page = 1;
    if(isEmptyField(page_size)) page_size = 10;
    if(getTrimmedValue(is_paginated) === "false") is_paginated = false;
    else is_paginated = true;
    
    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const response = await DeletedUserModel.list({
      sort, 
      limit, 
      offset, 
      keyword, 
      is_paginated,
      from_date,
      to_date,
      id,
      type
    })

    const resPromises = response?.rows?.map( async el=>{
      let userDecryptedData = await decrypt(el.user_details.enc);
      userDecryptedData = JSON.parse(userDecryptedData)
      return {
        id: el.id,
        user_id: el.user_id,
        email: el.user_email || userDecryptedData.email,
        first_name: userDecryptedData.first_name,
        last_name: userDecryptedData.last_name,
        country_code: el.country_code || userDecryptedData.country_code,
        mobile: el.mobile || userDecryptedData.mobile,
        status: el.status,
        deleted_count: el.deleted_count,
        created_at: el.created_at,
      }
    }) || [];

    let list = await Promise.all(resPromises);
    let count = response?.count || 0;

    if(!isEmptyField(keyword)){
        list = list.filter(el=> {
            const name = el.first_name+` `+el.last_name;
            const isMatched = el.email?.match(new RegExp(`.*${keyword}.*`)) || name?.match(new RegExp(`.*${keyword}.*`)) || el?.mobile?.match(new RegExp(`.*${keyword}.*`))
            return isMatched;
        })
        count = list.length
    }

    return {
      count: count,
      rows: list || []
    };
  }

  /**
  * update deleted user
  * @param {string} body - name, email values.
  */
   static async update(body) {
    let {
      status,
      id,
      user,
    } = body;

    const mandatoryFieldStatus = checkMandatoryFields({
      id
    });

    if (mandatoryFieldStatus.errorCode == mandatoryFieldErrorCode) {
      throw new ClientError(mandatoryFieldStatus.errorMessage);
    }

    const [deletedUser] = await DeletedUserModel.getOneByColumns({
      columns: ["uid"],
      values: [id],
    });
    
    if (!deletedUser) {
        throw new ClientError('Deleted uer not found');
    }

    const updateObj = {}
    if(!isEmptyField(status)) updateObj.status = status;
  
    await DeletedUserModel.updateOneById(updateObj, deletedUser.id);

    return { msg: 'Deleted user updated' };
  }

  static async getDeletedUsersInfoByIds(body) {
    let {
        user_ids,
    } = body;

    user_ids = user_ids.split(",")
    let deletedUsers = await DeletedUserModel.getAllByColumnsByInQuery({columns: ['usr.uid'], values: [user_ids]});
   
    const modifiedRespPromise = deletedUsers.map(async el=> {
      let userDecryptedData = await decrypt(el.user_details.enc);
      userDecryptedData = JSON.parse(userDecryptedData)
      return {
        "uid": el.uid,
        "user_id": el.user_id,
        "user_email": el.user_email,
        "user_name": userDecryptedData.first_name,
        "user_mobile": userDecryptedData.mobile ?? ''
      }
    })

    const modifiedResp = await Promise.all(modifiedRespPromise);

    return {
        msg: `User updated successfully`,
        deleted_users: modifiedResp
    }
}
}

module.exports = DeletedUserService;
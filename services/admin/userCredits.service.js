const ClientError = require("../../error/clientError");

const UsersModel = require("../../models/mysql/users.model");
const UserCreditsModel = require("../../models/mysql/userCredits.model.js");
const UserWalletModel = require("../../models/mysql/userWallet.model.js");
const UserPointsModel = require("../../models/mysql/userPoints.model.js");

const {CASHOUT_LOCK_REDIS_KEY, CONVERT_LOCK_REDIS_KEY} = require("../../constants/variables.js")
const { 
  isEmptyField, 
  getTrimmedValue, 
  formatDecimal, 
  replaceStringVar,
  getKeyByValue
} = require("../../utils/common");

const { 
  Pagination,
  USER_CREDIT_STATUS,
  USER_CREDIT_TYPE,
  CASHOUT_APPROVED_STATUS,
  USER_TYPE,
  CASHOUT_TYPE,
  USER_POINTS_TYPE,
  Bit
} = require("../../constants/database");

const { delData } = require("../../dbConfig/redisConnect.js")

class UserCreditsService {
  /**
   * list cashout requests
   *
   * @static
   * @param {number} page - number of specific page
   * @param {number} page_size - number of elements every page will contain
   * @param {boolean} is_paginated - true/false:if return paginated data or complete data
   * @param {string} sort_by - order list by a specific column
   * @param {string} order - desc/asc:order list in desc or asc order
   * @param {string} keyword - search by keyword
   * @param {date} from_date - filter from date
   * @param {date} to_date - filter up to date
   * @param {object} user - adin information
   * @return {object} - return request count and list
   * @memberof UserCreditsService
   */
  static async listCashout(body) {
    let {
      page,
      page_size,
      is_paginated,
      sort_by,
      order,
      keyword,
      from_date,
      to_date,
      id,
      user_id,
      credit_type,
      approved_status,
      user,
      request_header,
    } = body;

    if (isEmptyField(sort_by)) sort_by = Pagination.defaultSortColumn;
    if (isEmptyField(order)) order = Pagination.defaultOrder;
    if (isEmptyField(page)) page = Pagination.defaultPage;
    if (isEmptyField(page_size)) page_size = Pagination.pageSize;
    if (getTrimmedValue(is_paginated) == "false") is_paginated = false;
    else is_paginated = true;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    // const [userData] = await UsersModel.getUserDataById(user?.id);
    // let userData;
    // if(!isEmptyField(user_id)){
    //   [userData] = await UsersModel.getUserDataByUid(user_id);
    //   if(!userData)
    //     throw new ClientError('User not found');
    // }

    if (isEmptyField(credit_type)){
      credit_type = USER_CREDIT_TYPE.CASHOUT
    };

    const userCredits = await UserCreditsModel.list({
      sort,
      limit,
      offset,
      is_paginated,
      keyword,
      from_date,
      to_date,
      user,
      id,
      user_id: user_id,
      credit_type,
      approved_status
    });

    const modifiedRows = userCredits?.rows?.map(el => {
      return {
        id: el.uid,
        amount: formatDecimal(el.amount),
        points: formatDecimal(el.points),
        usable_amount: formatDecimal(el.usable_amount),
        expiration_at: el.expiration_at,
        is_expired: el.is_expired,
        type: el.type,
        approved_status: el.approved_status,
        approved_status_text: getKeyByValue(CASHOUT_APPROVED_STATUS, el.approved_status),
        entity_title: el.entity_title,
        cashout_type: el.cashout_type,
        status: el.status,  //0(tried), 1 (completed conversion), -1 (expired)
        status_text: getKeyByValue(USER_CREDIT_STATUS, el.status),  //0(tried), 1 (completed conversion), -1 (expired)
        created_at: el.created_at,
        user: el.user,
      }
    })
    return { count: (userCredits.count || 0), rows: modifiedRows || [] }
  }

  static async listConvertHistory(body) {
    let {
      page,
      page_size,
      is_paginated,
      sort_by,
      order,
      keyword,
      from_date,
      to_date,
      id,
      user_id,
      credit_type,
      approved_status,
      user,
      request_header,
    } = body;

    if (isEmptyField(sort_by)) sort_by = Pagination.defaultSortColumn;
    if (isEmptyField(order)) order = Pagination.defaultOrder;
    if (isEmptyField(page)) page = Pagination.defaultPage;
    if (isEmptyField(page_size)) page_size = Pagination.pageSize;
    if (getTrimmedValue(is_paginated) == "false") is_paginated = false;
    else is_paginated = true;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    // const [userData] = await UsersModel.getUserDataById(user?.id);
    // let userData;
    // if(!isEmptyField(user_id)){
    //   [userData] = await UsersModel.getUserDataByUid(user_id);
    //   if(!userData)
    //     throw new ClientError('User not found');
    // }

    if (isEmptyField(credit_type)){
      credit_type = USER_CREDIT_TYPE.ADD
    };

    const userCredits = await UserCreditsModel.list({
      sort,
      limit,
      offset,
      is_paginated,
      keyword,
      from_date,
      to_date,
      user,
      id,
      user_id: user_id,
      credit_type,
      approved_status
    });

    const modifiedRows = userCredits?.rows?.map(el => {
      return {
        id: el.uid,
        amount: formatDecimal(el.amount),
        points: formatDecimal(el.points),
        usable_amount: formatDecimal(el.usable_amount),
        expiration_at: el.expiration_at,
        is_expired: el.is_expired,
        type: el.type,
        // approved_status: el.approved_status,
        // approved_status_text: getKeyByValue(CASHOUT_APPROVED_STATUS, el.approved_status),
        entity_title: el.entity_title,
        cashout_type: el.cashout_type,
        status: el.status,  //0(tried), 1 (completed conversion), -1 (expired)
        status_text: getKeyByValue(USER_CREDIT_STATUS, el.status),  //0(tried), 1 (completed conversion), -1 (expired)
        created_at: el.created_at,
        user: el.user,
      }
    })
    return { count: (userCredits.count || 0), rows: modifiedRows || [] }
  }

  /**
   * cash out available credits(only for influencer users)
   *
   * @static
   * @param {object} points - points to redeem
   * @param {object} user - user information
   * @return {object} - return available coins, points and expiry date
   * @memberof UserCreditsService
   */
  static async updateApproveStatus(body) {
    let {
      id,
      approved_status,
      dbTransaction
    } = body;

    const [usrCashoutRqstResult] = await UserCreditsModel.getCashoutRequest({column: 'uid', value: id}, dbTransaction);

    if(!usrCashoutRqstResult)
      throw new ClientError('Cashout Request not found');

    const userData = await UsersModel.findUserWithId(usrCashoutRqstResult?.user_id, dbTransaction);

    if(!userData)
      throw new ClientError('User not found');

    if(userData.user_type != USER_TYPE.INFLUENCER)
      throw new ClientError('User are not an influencer');

    if(approved_status == CASHOUT_APPROVED_STATUS.APPROVED){
      const creditsToCashout = Number(usrCashoutRqstResult.amount);

      if(usrCashoutRqstResult.cashout_type == CASHOUT_TYPE.POINTS){
        const userCurrentPoints = Number(userData.total_points);
        let pointsToCashout = usrCashoutRqstResult?.points;
        pointsToCashout = Number(pointsToCashout);
    
        if(userCurrentPoints < pointsToCashout)
          throw new ClientError('Points are not available');

        const remainingPoints = userCurrentPoints - pointsToCashout;
        await UsersModel.updateOneById({total_points: remainingPoints}, userData.id, dbTransaction);
      } else {
        const [userWallet] = await UserWalletModel.getOneByColumn({ column: 'user_id', value: userData.id }, dbTransaction);
        const userCurrentCredits = Number(userWallet?.amount);
        if(userCurrentCredits < creditsToCashout)
          throw new ClientError('Credits are not available');

        const updatedAmt = userWallet?.amount-creditsToCashout;
        // update user wallet
        const userWalletResult = await UserWalletModel.updateOneById({amount: updatedAmt}, userWallet.id, dbTransaction);
      }
    }

    //update approve status
    const userCashoutRequest = await UserCreditsModel.updateOneById({approved_status: approved_status}, usrCashoutRqstResult.id, dbTransaction);

    return { 
      msg: 'Cashout Request updated successfully', 
    };
  }

  /**
   * cash out available credits(only for influencer users)
   *
   * @static
   * @param {object} points - points to redeem
   * @param {object} user - user information
   * @return {object} - return available coins, points and expiry date
   * @memberof UserCreditsService
   */
  static async updateApproveStatusV1(body) {
    let {
      id,
      approved_status,
      dbTransaction
    } = body;

    const [usrCashoutRqstResult] = await UserCreditsModel.getCashoutRequest({column: 'uid', value: id}, dbTransaction);

    if(!usrCashoutRqstResult)
      throw new ClientError('Cashout Request not found');

    const userData = await UsersModel.findUserWithId(usrCashoutRqstResult?.user_id, dbTransaction);

    if(!userData)
      throw new ClientError('User not found');

    if(userData.user_type != USER_TYPE.INFLUENCER)
      throw new ClientError('User is not an influencer');

    const currentApproveStatus = usrCashoutRqstResult.approved_status;
    if(currentApproveStatus == CASHOUT_APPROVED_STATUS.APPROVED || currentApproveStatus == CASHOUT_APPROVED_STATUS.REJECTED)
      throw new ClientError('Request already either accepted or rejected');

    let status = usrCashoutRqstResult.status;
    const creditsToCashout = Number(usrCashoutRqstResult.amount);
    const userCurrentPoints = Number(userData.total_points);
    let pointsToCashout = usrCashoutRqstResult?.points;
    pointsToCashout = Number(pointsToCashout);

    if(approved_status == CASHOUT_APPROVED_STATUS.APPROVED){
      status = USER_CREDIT_STATUS.PROCESSED;
  
      // if(userCurrentPoints < pointsToCashout)
      //   throw new ClientError('Points are not available');

      // const remainingPoints = userCurrentPoints - pointsToCashout;
      // await UsersModel.updateOneById({total_points: remainingPoints}, userData.id, dbTransaction);
    } else if(approved_status == CASHOUT_APPROVED_STATUS.REJECTED){
      const remainingPoints = userCurrentPoints + pointsToCashout;
      await UsersModel.updateOneById({total_points: remainingPoints}, userData.id, dbTransaction);
      status = USER_CREDIT_STATUS.FAILED;
    }
    //update approve status
    const userCashoutRequest = await UserCreditsModel.updateOneById({approved_status: approved_status, status}, usrCashoutRqstResult.id, dbTransaction);
    if(
      approved_status == CASHOUT_APPROVED_STATUS.APPROVED || 
      approved_status == CASHOUT_APPROVED_STATUS.REJECTED){
        const cashoutLockRedisKey = replaceStringVar(CASHOUT_LOCK_REDIS_KEY, {'{{userId}}': userData.id})
        delData(cashoutLockRedisKey)
    }
    return { 
      msg: 'Cashout Request updated successfully', 
    };
  }

  static async updatePendingConvertPointToCreditStatus(body = {}) {
    let {
      dbTransaction
    } = body;

    const usrRedeemRqstList = await UserCreditsModel.getPendingRedeemRequest({}, dbTransaction);

    if(!usrRedeemRqstList || !usrRedeemRqstList.length)
      throw new ClientError('No Redeem Request found');

    const rqstIds = usrRedeemRqstList.map(el=>{
      return el.id
    })

    for(let redeemRqst of usrRedeemRqstList){
      //update user wallet
      const userWalletResult = await UserWalletModel.updateUserWallet(redeemRqst.user_id, redeemRqst.amount, dbTransaction);
      const cashoutLockRedisKey = replaceStringVar(CASHOUT_LOCK_REDIS_KEY, {'{{userId}}': redeemRqst.user_id})
      delData(cashoutLockRedisKey)
    }
     
    //update approve status
    const userCashoutRequest = await UserCreditsModel.updateManyById({ status: USER_CREDIT_STATUS.COMPLETED }, rqstIds, dbTransaction);
    return { 
      msg: 'Redeem Request updated successfully', 
    };
  }

  static async updateInfluencerCommissionCreditStatus(body = {}) {
    let {
      dbTransaction
    } = body;

    const influencerCommCredits = await UserCreditsModel.getPendingInfluencerCommissionCredit({}, dbTransaction);

    for(let row of influencerCommCredits){
      const remainingPoints = Number(row?.referee_total_points) + Number(row?.total_influencer_commission);
      const userPointsIds = row.user_points.map(el=>el.id);

      // const updateUserTotalPointPromise = await UsersModel.updateOneById({total_points: remainingPoints}, row?.referee_id, dbTransaction);
      //create user point of type 'influencer_commission_credit' entry
      const createUserPointEntryPromise = await UserPointsModel.insert({
        user_id: row.referee_id,
        points: row?.total_influencer_commission,
        points_type: USER_POINTS_TYPE.INFLUENCER_COMMISSION_CREDIT,
        details: {
          month: row?.month,
          start_date: row?.start_date,
          end_date: row?.end_date,
          first_id: row?.first_id,
          last_id: row?.last_id
        }
      }, dbTransaction);

      const updateCreditStatusPromise = await UserPointsModel.updateManyById({commission_credited: Bit.one}, userPointsIds, dbTransaction);
      await Promise.all([/*updateUserTotalPointPromise,*/ createUserPointEntryPromise, updateCreditStatusPromise])
    }
    return { 
      msg: 'Influencer Commission updated successfully', 
    };
  }
}

module.exports = UserCreditsService;

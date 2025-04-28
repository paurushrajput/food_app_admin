const CommissionPaymentHistoryModel = require("../../models/mysql/commissionPaymentHistory.model.js");
const RestaurantsModel = require("../../models/mysql/restaurants.model");
const ReservationModel = require("../../models/mysql/reservation.model");
const MediaModel = require("../../models/mysql/media.model");
const ClientError = require("../../error/clientError");
const {checkMandatoryFields, isEmptyField, getTrimmedValue} = require("../../utils/common.js");
const { mandatoryFieldErrorCode } = require("../../constants/statusCode");
const { getUrlFromBucket } = require("../../utils/s3");
const { BookingTrackStatus } = require("../../constants/database");

class CommissionPaymentHistoryService {
  /**
  * list tournaments
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
      res_id,
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

    const response = await CommissionPaymentHistoryModel.list({
      sort, 
      limit, 
      offset, 
      keyword, 
      is_paginated,
      from_date,
      to_date,
      id,
      type,
      res_id
    })

    response.rows = response?.rows?.map(el=>({
      id: el.id,
      res_id: el.res_id,
      amount: Number(el.amount),
      from_date: el.from_date,
      to_date: el.to_date,
      payment_date: el.payment_date,
      other_details: el.other_details,
      payment_mode: el.payment_mode,
      ref_txn_id: el.ref_txn_id,
      status: el.status,
      created_at: el.created_at,
      deleted_at: el.deleted_at,
    })) || []

    return {
      count: response?.count || 0,
      rows: response?.rows || []
    };
  }

  /**
  * add payment
  * @param {string} body - name, email values.
  */
   static async add(body) {
    let {
      res_id,
      amount,
      from_date,
      to_date,
      payment_date,
      other_details = {},
      payment_mode,
      ref_txn_id,
      user
    } = body;
    
    const mandatoryFieldStatus = checkMandatoryFields({
      res_id,
      amount,
      from_date,
      to_date,
      payment_date,
      payment_mode
    });

    if (mandatoryFieldStatus.errorCode == mandatoryFieldErrorCode) {
      throw new ClientError(mandatoryFieldStatus.errorMessage);
    }

    let [restaurant] = await RestaurantsModel.findRestaurantById(res_id);
    if (!restaurant) {
      throw new ClientError('Invalid restaurant_id');
    }

    // let getMediaId
    // if(!isEmptyField(image_id)){
    //   [getMediaId] = await MediaModel.getOneByuId(image_id);

    //   if(!getMediaId)
    //     throw new ClientError("image not found in media");
    // }

    const updateResObj = {};
    const [resCommission] = await ReservationModel.getTotalCommission(restaurant.id, BookingTrackStatus.payment_completed);
    const totalCommission = Number(resCommission?.total_commission) || 0;
    let commission_settled = Number(restaurant.commission_settled) + Number(amount)
    if(Number(totalCommission) < Number(commission_settled))
      throw new ClientError(`total_commission cannot be less than commission_settled.`);
    updateResObj.commission_settled = commission_settled;

    const insertObj = { 
      amount,
      // image_id: getMediaId?.id || null,
      from_date,
      to_date,
      payment_date,
      other_details,
      payment_mode,
      ref_txn_id,
      res_id: restaurant.id,
      created_by: user,
      // updated_by: user,
    };
  
    await CommissionPaymentHistoryModel.insert(insertObj);
    await RestaurantsModel.updateOneById(updateResObj, restaurant.id);

    return { msg: 'Payment Added' };
  }

  /**
  * update payment
  * @param {string} body - name, email values.
  */
   static async update(body) {
    let {
      amount,
      from_date,
      to_date,
      payment_date,
      other_details = {},
      payment_mode,
      ref_txn_id,
      id,
      user,
    } = body;

    const mandatoryFieldStatus = checkMandatoryFields({
      id
    });

    if (mandatoryFieldStatus.errorCode == mandatoryFieldErrorCode) {
      throw new ClientError(mandatoryFieldStatus.errorMessage);
    }

    const [payment] = await CommissionPaymentHistoryModel.getOneByColumns({
      columns: ["uid"],
      values: [id],
    });

    if (!payment) throw new ClientError("Payment not found");


    const updateResObj = {};
    let restaurant;
    if(!isEmptyField(amount)){
      [restaurant] = await RestaurantsModel.findRestaurantById(null, payment.res_id);
      if (!restaurant) {
        throw new ClientError('Invalid restaurant_id');
      }
  
      const [resCommission] = await ReservationModel.getTotalCommission(restaurant.id, BookingTrackStatus.payment_completed);
      const totalCommission = Number(resCommission?.total_commission) || 0;
      let commission_settled = Number(restaurant.commission_settled) - Number(payment.amount) + Number(amount)
      if(Number(totalCommission) < Number(commission_settled))
        throw new ClientError(`total_commission cannot be less than commission_settled.`);
      updateResObj.commission_settled = commission_settled;
    }
    
    const updateObj = { updated_by: user };

    // let getMediaId
    // if(!isEmptyField(image_id)){
    //   [getMediaId] = await MediaModel.getOneByuId(image_id);

    //   if(!getMediaId)
    //     throw new ClientError("image not found in media");

    //   updateObj.image_id = getMediaId?.id;
    // }

    if(!isEmptyField(amount)) updateObj.amount = amount;
    if(!isEmptyField(from_date)) updateObj.from_date = from_date;
    if(!isEmptyField(to_date)) updateObj.to_date = to_date;
    if(!isEmptyField(payment_date)) updateObj.payment_date = payment_date;
    if(!isEmptyField(other_details)) updateObj.other_details = other_details;
    if(!isEmptyField(payment_mode)) updateObj.payment_mode = payment_mode;
    if(!isEmptyField(ref_txn_id)) updateObj.ref_txn_id = ref_txn_id;
  
    await CommissionPaymentHistoryModel.updateOneById(updateObj, payment.id);
    if(Object.keys(updateResObj).length){
      await RestaurantsModel.updateOneById(updateResObj, restaurant.id);
    }

    return { msg: 'Payment Updated' };
  }

  /**
  * delete payment
  * @param {string} body - payment id.
  */
  static async delete(body) {
    let {
      id,
      user,
    } = body;

    const mandatoryFieldStatus = checkMandatoryFields({
      id
    });

    if (mandatoryFieldStatus.errorCode == mandatoryFieldErrorCode) {
      throw new ClientError(mandatoryFieldStatus.errorMessage);
    }

    const [payment] = await CommissionPaymentHistoryModel.getOneByColumns({
      columns: ["uid"],
      values: [id],
    });

    if (!payment) throw new ClientError("Payment not found");

    const updateResObj = {};
    let [restaurant] = await RestaurantsModel.findRestaurantById(null, payment.res_id);
    if (!restaurant) {
      throw new ClientError('Invalid restaurant_id');
    }

    const [resCommission] = await ReservationModel.getTotalCommission(restaurant.id, BookingTrackStatus.payment_completed);
    const totalCommission = Number(resCommission?.total_commission) || 0;
    let commission_settled = Number(restaurant.commission_settled) - Number(payment.amount)
    if(Number(totalCommission) < Number(commission_settled))
      throw new ClientError(`total_commission cannot be less than commission_settled.`);
    updateResObj.commission_settled = commission_settled;
    
    const updateObj = {
      deleted_at: `now()`
    };
  
    await CommissionPaymentHistoryModel.updateOneById(updateObj, payment.id);
    await RestaurantsModel.updateOneById(updateResObj, restaurant.id);

    return { msg: 'Payment Deleted' };
  }
}

module.exports = CommissionPaymentHistoryService;
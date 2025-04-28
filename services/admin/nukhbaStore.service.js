const ClientError = require("../../error/clientError");
const CouponsModel = require("../../models/mysql/coupons.model");
const NukhbaStoreModel = require("../../models/mysql/nukhbaStore.model");
const MediaModel = require("../../models/mysql/media.model");
const { isEmptyField } = require("../../utils/common");
const { getUrlFromBucket } = require("../../utils/s3");
const { Bit, NukhbaStoreType } = require("../../constants/database");

class NukhbaStoreService {
  static async add(data) {
    const { title, description, type, coupon_id, image_id, points, status } =
      data;

    //title check
    const titleRes = await NukhbaStoreModel.findOneByTitle(title);
    if (titleRes?.length >= 1) {
      throw new ClientError("Title already exist.");
    }

    if(Number(type)===1){
      if(isEmptyField(coupon_id)){
        throw new ClientError("Coupon id is required.");
      }
    }

    let couponRes ;

    //coupon_id check
    if(!isEmptyField(coupon_id)){
      [couponRes] = await CouponsModel.findOneByuId(coupon_id);
      console.log('>>>>.. couponRes:',couponRes);

      if (!couponRes) {
        throw new ClientError("coupon_id is invalid.");
      }

      if(Number(couponRes.type) !== 4){
        throw new ClientError("Coupon type is not valid.");
      }
    }

    // image id check
    const [getMediaId] = await MediaModel.getOneByuId(image_id);
    if (!getMediaId) {
      throw new ClientError("image not found in media");
    }

    const payload = {
      title,
      description,
      type,
      coupon_id:couponRes?.id,
      image_id:getMediaId?.id,
      points,
      status,
    };


    console.log('>>>>>.. payload:',payload);

    const insertRes = await NukhbaStoreModel.insert(payload);
    return insertRes;
  }

  static async get(data) {
    let {
      page = 1,
      page_size = 10,
      is_paginated = true,
      sort_by = "ns.created_at",
      order = "desc",
      status,
    } = data;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const findRes = await NukhbaStoreModel.findAll({ sort, offset, limit });
    findRes.rows?.map((item) => {
      item.image = getUrlFromBucket(item.image);
      return item;
    });
    findRes.rows?.map((item)=> {
      item.type = NukhbaStoreType[item.type]
    })
    return findRes;
  }

  static async delete(data) {
    let { store_id } = data;

    const [store] = await NukhbaStoreModel.findOneByUID(store_id);

    //checking if coupons exists
    if (!store) {
        throw new ClientError("Invalid store id")
    }

    //soft deleting coupon
    const { rows } = await NukhbaStoreModel.updateOneById({ deleted_at: "CURRENT_TIMESTAMP" }, store?.id);
    if (rows != 1) {
        throw new GeneralError('Unable to delete store');
    }
    return {
        msg: "Store deleted successfully"
    };

    // const findRes = await NukhbaStoreModel.deleteByUid(store_id);
    // return findRes;
  }

  static async update(data) {
    const {
      title,
      description,
      type,
      coupon_id,
      image_id,
      points,
      status,
      store_id,
    } = data;

    const [existingStore] = await NukhbaStoreModel.findOneByUID(store_id);
    if (!existingStore) {
      throw new ClientError("Invalid store_id");
    }
    // title check
    if(title){
      if(existingStore?.title !== title){
        const titleRes = await NukhbaStoreModel.findOneByTitle(title);
        if (titleRes?.length >= 1) {
          throw new ClientError("Title already exist.");
        }
      }
    }
    

    let store = {}
    if(title){
      store.title = title
    }
    if(description){
      store.description = description
    }

    if(image_id){
      // image id check
    const [getMediaId] = await MediaModel.getOneByuId(image_id);
    if (!getMediaId) {
      throw new ClientError("image not found in media");
    }
      store.image_id = getMediaId?.id
    }
    if(points){
      store.points = points
    }
    if(type){
      store.type = type
      if(Number(type)===Bit.two){
        store.coupon_id = "null"
      }
      if(Number(type)===Bit.one){
        if(isEmptyField(coupon_id)){
           throw new ClientError('Client id is required with type coupon.') 
        }else{
          let couponRes
          //coupon_id check
          if(!isEmptyField(coupon_id)){
            [couponRes] = await CouponsModel.findOneByuId(coupon_id);
            if (!couponRes) {
              throw new ClientError("coupon_id is invalid.");
            }
            if(Number(couponRes.type) !== 4){
              throw new ClientError("Coupon type is not valid.");
            }
             store.coupon_id = couponRes?.id 
          }
        }
      }
    }
    if(Number(status)===Bit.zero || Number(status)===Bit.one ){
      store.status = status
    }

    const { rows } = await NukhbaStoreModel.updateOneById(
      store,
      existingStore.id
    );
    if (rows != 1) {
      throw new GeneralError("Unable to updated store");
    }
    return {
      msg: "Store updated successfully",
    };
  }
}

module.exports = NukhbaStoreService;

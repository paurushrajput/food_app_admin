const RestaurantsModel = require("../../models/mysql/restaurants.model.js");
const MediaModel = require("../../models/mysql/media.model.js");
const { getUrlFromBucket } = require("../../utils/s3.js");
const { CategoryType, UserDealStatus, DEAL_TYPE, Bit, DEAL_COMMISSION_TYPE, DEAL_TEMPLATE, PAY_AT_RESTRO_TEXT } = require("../../constants/database.js");
const ClientError = require("../../error/clientError.js");
const { isEmptyField, getTrimmedValue, getKeyByValue, isCurrentTimeBetween, isCurrentTimeGreaterThan, isValidTime, isValidDate, isEmpty } = require("../../utils/common.js");
const CategoryModel = require("../../models/mysql/category.model.js");
const DealsModel = require("../../models/mysql/deals.model.js");
const ServerError = require("../../error/serverError.js");
const { dateToMillis, splitTimeRange, validateStartTimeAndEndTime, validateTimeSlots, reverseTimeSlots } = require("../../utils/moment.js");
const DealOptionService = require("./dealOption.service.js");
const UserDealModel = require("../../models/mysql/userDeal.model.js");
const MerchantsModel = require("../../models/mysql/merchants.model.js");
const CampaignModel = require("../../models/mysql/campaign.model");
const { PaymentStatus, OrderStatusCode } = require("../../constants/payments.js");
const DealSlotModel = require("../../models/mysql/dealSlots.model.js");
const DealCategoriesModel = require("../../models/mysql/dealCategories.model.js");

class DealService {

  static async addDeal(body) {
    let {
      title,
      description,
      images,
      home_image,
      start_time,
      end_time,
      restaurant_id,
      deal_categories,
      days_validity,
      deal_option,
      deal_conditions,
      deal_highlights,
      otp_required,
      permitted_restaurant_ids = [],
      type,
      is_pilot,
      campaign_id,
      user,
      dbTransaction,
      share_message_deal,
      share_message_free_deal,
      is_locked = Bit.zero,
      lock_conditions = {},
      device_check = Bit.zero,
      template,
      slots,
      // interval_in_mins,
      // start_at,
      // end_at,
      days,
      exclude_dates,
      pre_select_branch,
      free_with_nukhba_credits
    } = body;

    let imageIds = [];

    if (!isEmptyField(images)) {
      const media = await MediaModel.getAllByUIds(images, dbTransaction) || [];
      const availableMediaUIds = media?.map(m => m.uid);
      const availableMediaIds = media?.map(m => m.id);

      const invalidMediaIds = images.filter(imageId => !availableMediaUIds.includes(imageId));
      if (invalidMediaIds && invalidMediaIds.length > 0) {
        throw new ClientError(`Invalid media id found - ${invalidMediaIds.join(", ")}`);
      }

      imageIds = [...availableMediaIds];
    }

    const [restaurant] = await RestaurantsModel.findRestaurantById(restaurant_id, null, dbTransaction);
    if (!restaurant) {
      throw new ClientError('Invalid Restaurant Id');
    }

    if (type == DEAL_TYPE.FREE && deal_option.length > 1) {
      throw new ClientError("Only one deal option is permitted when deal is of type free")
    }

    const allowedRestaurants = [];
    if (permitted_restaurant_ids.length > 0) {
      const merchantId = restaurant.mer_id;
      const restaurantAllowed = await MerchantsModel.findAllRestaurantsByMerchants(merchantId);
      for (let restaurant_id of permitted_restaurant_ids) {
        const foundRestaurant = restaurantAllowed.find(elem => elem.uid == restaurant_id);
        if (!foundRestaurant) {
          throw new ClientError("Invalid restaurantId found in permitted_restaurant_ids");
        }
        allowedRestaurants.push(foundRestaurant.id);
      }
    } else {
      allowedRestaurants.push(restaurant.id)
    }

    // deal_categories
    // deal_id  


    const categories = await CategoryModel.getCategoriesByUID(deal_categories,dbTransaction)
    if (!categories) throw new ClientError("Categories not found");

    let categoriesIds= []
    // collect ids of categories 
    categories?.map((item,i)=>{
      categoriesIds.push(item.id)
    })

    title = getTrimmedValue(title, true, false)
    const [existDeal] = await DealsModel.findOneByName(title, dbTransaction);
    if (existDeal)
      throw new ClientError("Deal already exist with same title")

    const startTime = isEmptyField(start_time) ? Date.now() : dateToMillis(start_time);
    const endTime = dateToMillis(end_time);
    if (endTime < startTime) {
      throw new ClientError('end time cannot be less than start time');
    }

    const dealObj = {
      title,
      description,
      images: imageIds,
      start_time: startTime,
      end_time: endTime,
      restaurant_id: restaurant.id,
      type,
      is_locked,
      device_check
    }

    if (!isEmptyField(template)) {
      dealObj.template = template;
    }

    const isTemplateAvailable = !isEmptyField(template) && template == DEAL_TEMPLATE.WITH_SLOT;

    if (isTemplateAvailable) {
      // if (!isEmptyField(interval_in_mins)) {
      //   if (!isEmptyField(template) && template == DEAL_TEMPLATE.WITHOUT_SLOT) throw new ClientError(`Slot type should be ${DEAL_TEMPLATE.WITH_SLOT} when interval is not null`)
      //   dealObj.interval_in_mins = interval_in_mins;
      // }

      // if (!isEmptyField(start_at)) {
      //   if (!isValidTime(start_at)) throw new ClientError("time format of start_at should be hh:mm:ss or hh:mm")
      //   dealObj.start_at = start_at;
      // } else {
      //   throw new ClientError(`start at is required when template is ${DEAL_TEMPLATE.WITH_SLOT}`)
      // }

      // if (!isEmptyField(end_at)) {
      //   if (!isValidTime(end_at)) throw new ClientError("time format of start_at should be hh:mm:ss or hh:mm")
      //   dealObj.end_at = end_at;
      // } else {
      //   throw new ClientError(`end at is required when template is ${DEAL_TEMPLATE.WITH_SLOT}`)
      // }

      // if (!validateStartTimeAndEndTime(start_at, end_at)) {
      //   throw new Error("start at should not be greater than or equal to end at.");
      // }

      if (!isEmptyField(days)) {
        const removeDays = [...new Set(days)];
        console.log({ removeDays, days })
        if (removeDays.length != days.length) throw new ClientError("days contain duplicate day")
        dealObj.days = days;
      } else {
        throw new ClientError(`days is required when template is ${DEAL_TEMPLATE.WITH_SLOT}`)
      }

      // if (!isEmptyField(exclude_dates)) {
      if (exclude_dates != null) {
        const removeExcludeDates = [...new Set(exclude_dates)];
        if (removeExcludeDates.length != exclude_dates.length) throw new ClientError("exclude dates contain duplicate dates")
        for (let date of exclude_dates) {
          if (!isValidDate(date)) throw new ClientError("date format of exclude_dates must be YYYY-MM-DD")
        }
      }
      dealObj.exclude_dates = exclude_dates;
      // } else {
      //   throw new ClientError(`exclude dates is required when template is ${DEAL_TEMPLATE.WITH_SLOT}`)
      // }
    }

    if (!isEmptyField(home_image)) {
      const [media] = await MediaModel.getAllByUIds([home_image], dbTransaction) || [];
      if (!media) {
        throw new ClientError(`Invalid home image id found`);
      }

      dealObj.home_image = media.id;
    }

    if (!isEmptyField(is_pilot)) {
      if (restaurant?.is_pilot == Bit.one && is_pilot == Bit.zero) {
        throw new ServerError("Live deal cannot be created for pilot restaurant");
      }
      dealObj.is_pilot = is_pilot
    } else {
      dealObj.is_pilot = restaurant?.is_pilot;
    }

    if (!isEmptyField(days_validity) && Number(days_validity > 0)) {
      dealObj.days_validity = days_validity
    }

    if (!isEmptyField(deal_conditions)) {
      if (!dealObj.details) {
        dealObj.details = {}
      }
      dealObj.details.deal_conditions = deal_conditions
    }

    if (!isEmptyField(deal_highlights)) {
      if (!dealObj.details) {
        dealObj.details = {}
      }
      dealObj.details.deal_highlights = deal_highlights
    }

    if (!isEmptyField(pre_select_branch)) {
      if (!dealObj.details) {
        dealObj.details = {}
      }
      dealObj.details.pre_select_branch = pre_select_branch
    }

    if (!isEmptyField(otp_required)) {
      if (!dealObj.details) {
        dealObj.details = {}
      }
      dealObj.details.otp_required = Number(otp_required)
    }

    if (!isEmptyField(campaign_id)) {
      //checking if campaign exists
      // const [campaign] = await CampaignModel.findOneByuId(campaign_id);
      const [campaign] = await CampaignModel.findRunningCampaignByColumn({ column: "uid", value: campaign_id });
      if (!campaign) {
        throw new ClientError("Invalid Campaign Id");
      }

      dealObj.campaign_id = campaign.id;
    }

    if (allowedRestaurants.length > 0) {
      if (!dealObj.details) {
        dealObj.details = {}
      }
      dealObj.details.res_id = allowedRestaurants
    }

    if (!isEmptyField(share_message_deal)) {
      dealObj.details.share_message_deal = share_message_deal
    }
    if (!isEmptyField(share_message_free_deal)) {
      dealObj.details.share_message_free_deal = share_message_free_deal
    }

    if (!isEmptyField(lock_conditions?.booking?.restaurant_id)) {
      const [restaurant] = await RestaurantsModel.findRestaurantById(lock_conditions.booking.restaurant_id, null, dbTransaction);
      if (!restaurant) {
        throw new ClientError('Invalid Restaurant Id for deal lock conditions');
      }
      lock_conditions.booking.restaurant_id = restaurant.id;
      lock_conditions.booking.restaurant_uid = restaurant.uid;
    }

    dealObj.details.lock_conditions = lock_conditions;

    if(!isEmpty(free_with_nukhba_credits)){
      if(type == DEAL_TYPE.FREE && free_with_nukhba_credits  == Bit.one){
        throw new ClientError('Deal type cannot be free when setting free with nukhba credits ');
      }
      dealObj.free_with_nukhba_credits = free_with_nukhba_credits
    }

    const { rows, lastInsertedId } = await DealsModel.insert(dealObj, dbTransaction);
    if (rows < 1) {
      throw new ServerError("Unable to add deal")
    }


    if (isTemplateAvailable && !isEmptyField(slots) && slots.length > 0) {
      let dealSlotData = [];

      if (!validateTimeSlots(slots)) {
        throw new Error("Slot validation failed.");
      }

      for (let slot of slots) {
        const { start_at, end_at, interval_in_mins } = slot;
        try {
          let slotData = isEmptyField(interval_in_mins) ? [{ startTime: start_at, endTime: end_at }] : splitTimeRange(start_at, end_at, interval_in_mins);
          slotData = slotData.map(sd => {
            return {
              ...sd,
              interval_in_mins
            }
          });
          dealSlotData.push(slotData)
        } catch (error) {
          throw new ClientError(error)
        }
      }

      // insert into deal slots
      const dealSlots = [];
      for (let dealSlot of dealSlotData.flat()) {
        const dealSlotObj = {
          deal_id: lastInsertedId,
          start_time: dealSlot.startTime,
          end_time: dealSlot.endTime,
          interval_in_mins: dealSlot.interval_in_mins,
        }

        dealSlots.push(dealSlotObj);
      }

      if (dealSlots.length > 0) {
        const { rows: dealSlotRows } = DealSlotModel.insert(dealSlots, dbTransaction);
        if (dealSlotRows < 1) {
          throw new ServerError("Unable to deal slots")
        }
      }
    }

    const result = await DealOptionService.addDealOption(null, deal_option.map(elem => {
      return {
        ...elem,
        deal_id: lastInsertedId
      }
    }), dbTransaction);

    // lastInsertedId
    const dealCatArr = []
    for(let i =0 ; i < categoriesIds?.length ; i++){
      let dealCatObj = {
        deal_id:lastInsertedId,
        cat_id: categoriesIds[i]
      }
      dealCatArr.push(dealCatObj)
      
    }

    if(dealCatArr?.length){
      const {rows : dealCatRows,msg} =  await DealCategoriesModel.insert(dealCatArr,dbTransaction)
    }

    return {
      msg: 'Deal added successfully'
    }
  }

  static async updateDeal(body) {
    let {
      deal_id,
      title,
      description,
      images,
      home_image,
      start_time,
      end_time,
      restaurant_id,
      deal_categories,
      days_validity,
      deal_conditions,
      deal_highlights,
      otp_required,
      dbTransaction,
      deal_option,
      type,
      is_pilot,
      campaign_id,
      status,
      permitted_restaurant_ids = [],
      user,
      share_message_deal,
      share_message_free_deal,
      sold_out,
      is_locked,
      lock_conditions,
      device_check,
      template,
      // interval_in_mins,
      // start_at,
      // end_at,
      slots,
      days,
      exclude_dates,
      pre_select_branch,
      free_with_nukhba_credits
    } = body;

    let [existingDeal] = await DealsModel.getOneByuId(deal_id, dbTransaction);
    if (!existingDeal) {
      throw new ClientError("Deal not found")
    }

    const isPilot = Number(existingDeal.is_pilot);
    //validation check
    if (isPilot == Bit.zero && !(!isEmptyField(is_pilot) && is_pilot == Bit.one)) {
      if (!isEmptyField(restaurant_id)) {
        throw new ClientError("For live deal, restaurant cannot be updated");
      }

      // if (!isEmptyField(start_time)) {
      //   throw new ClientError("For live deal, start time cannot be updated");
      // }

      // if (deal_categories?.length > 0) {
      //   throw new ClientError("For live deal, category cannot be updated");
      // }

      // if (!isEmptyField(is_pilot)) {
      //   throw new ClientError("For live deal, deal mode cannot be updated");
      // }

      if (!isEmptyField(campaign_id)) {
        throw new ClientError("For live deal, campaign cannot be updated");
      }

      if (!isEmptyField(days_validity)) {
        throw new ClientError("For live deal, validity cannot be updated");
      }

      if (!isEmptyField(permitted_restaurant_ids)) {
        throw new ClientError("For live deal, restaurant branch cannot be updated");
      }
    }

    let isDealLive = false;
    const currentMillis = Math.floor(Date.now() / 1000);
    if (existingDeal.start_time < currentMillis && isPilot == Bit.zero) {
      isDealLive = true;
    }

    const dealUpdateObj = {};

    if (!isEmptyField(template)) {
      if (isDealLive) {
        throw new ClientError("template cannot be updated while the deal status is live.")
      }
      dealUpdateObj.template = template;
    } else {
      template = existingDeal.template;
    }

    const isTemplateAvailable = !isEmptyField(template) && template == DEAL_TEMPLATE.WITH_SLOT;

    // if (isTemplateAvailable && !isEmptyField(interval_in_mins)) {
    //   if (isDealLive) throw new ClientError("interval in mins type cannot be updated while the deal status is live.")
    //   dealUpdateObj.interval_in_mins = interval_in_mins;
    // }

    // if (isTemplateAvailable && !isEmptyField(start_at)) {
    //   if (isDealLive) {
    //     throw new ClientError("start at cannot be updated while the deal status is live.")
    //   }
    //   if (!isValidTime(start_at)) throw new ClientError("time format of start_at should be hh:mm:ss or hh:mm")
    //   dealObj.start_at = start_at;
    // }

    // if (isTemplateAvailable && !isEmptyField(end_at)) {
    //   if (isDealLive) {
    //     throw new ClientError("end at cannot be updated while the deal status is live.")
    //   }
    //   if (!isValidTime(end_at)) throw new ClientError("time format of start_at should be hh:mm:ss or hh:mm")
    //   dealObj.end_at = end_at;
    // }

    // if (!isEmptyField(start_at) || !isEmptyField(end_at)) {
    //   if (isEmptyField(start_at)) start_at = existingDeal.start_at;
    //   if (isEmptyField(start_at)) start_at = existingDeal.start_at;
    //   if (!validateStartTimeAndEndTime(start_at, end_at)) throw new ClientError("start at should not be greater than or equal to end at.")
    // }

    if (isTemplateAvailable && !isEmptyField(days)) {
      // if (isDealLive) {
      //   throw new ClientError("days cannot be updated while the deal status is live.")
      // }
      const removeDays = [...new Set(days)];
      if (removeDays.length != days.length) throw new ClientError("days contain duplicate day")
      dealUpdateObj.days = days;
    }

    if (isTemplateAvailable) {
      // if (isDealLive && exclude_dates != null ) {
      //   throw new ClientError("exclude cannot be updated while the deal status is live.")
      // }
      if (exclude_dates != null) {
        const removeExcludeDates = [...new Set(exclude_dates)];
        if (removeExcludeDates.length != exclude_dates.length) throw new ClientError("exclude dates contain duplicate dates")
        for (let date of exclude_dates) {
          if (!isValidDate(date)) throw new ClientError("date format of exclude_dates must be YYYY-MM-DD")
        }
      }

      dealUpdateObj.exclude_dates = exclude_dates;
    }

    dealUpdateObj.days_validity = days_validity

    if (!isEmptyField(device_check)) {
      dealUpdateObj.device_check = device_check
    }

    // if (!isEmptyField(type)) {
    //   throw new ClientError("Deal type cannot be updated")
    // }

    const _type = type || existingDeal.type;
    if (_type == DEAL_TYPE.FREE && !isEmptyField(deal_option) && deal_option.length > 1) {
      throw new ClientError("Only one deal option is permitted when deal is of type free")
    }

    let imageIds = [];

    if (!isEmptyField(images)) {
      const media = await MediaModel.getAllByUIds(images, dbTransaction) || [];
      const availableMediaUIds = media?.map(m => m.uid);
      // const availableMediaIds = media?.map(m => m.id);
      const availableMediaIds = images?.map(img => {
        const existMedia = media.find(m => m.uid == img)
        return existMedia?.id;
      });

      const invalidMediaIds = images.filter(imageId => !availableMediaUIds.includes(imageId));
      if (invalidMediaIds && invalidMediaIds.length > 0) {
        throw new ClientError(`Invalid media id found - ${invalidMediaIds.join(", ")}`);
      }

      imageIds = [...availableMediaIds];
      dealUpdateObj.images = imageIds;
    }

    if (!isEmptyField(home_image)) {
      const [media] = await MediaModel.getAllByUIds([home_image], dbTransaction) || [];
      if (!media) {
        throw new ClientError(`Invalid home image id found`);
      }

      dealUpdateObj.home_image = media.id;
    }

    let [restaurant] = []

    if (!isEmptyField(restaurant_id)) {
      [restaurant] = await RestaurantsModel.findRestaurantById(restaurant_id, null, dbTransaction);
      if (!restaurant) {
        throw new ClientError('Invalid Restaurant Id');
      }
      if (isDealLive) {
        throw new ClientError("The restaurant cannot be updated while the deal status is live.")
      }
      dealUpdateObj.restaurant_id = restaurant.id;
    } else {
      [restaurant] = await RestaurantsModel.findRestaurantById(null, existingDeal.restaurant_id, dbTransaction);
    }

    if (!isEmptyField(is_pilot)) {
      if (restaurant?.is_pilot == Bit.one && is_pilot == Bit.zero) {
        throw new ServerError("Live deal cannot be created for pilot restaurant");
      }
      dealUpdateObj.is_pilot = is_pilot
    }


    let categories
    if(deal_categories?.length > 0){
      categories = await CategoryModel.getCategoriesByUID(deal_categories,dbTransaction)
      if (!categories?.length) throw new ClientError("Categories not found");
    }
    

    let categoriesIds= []
    // collect ids of categories 
    categories?.map((item,i)=>{
      categoriesIds.push(item.id)
    })


    const dealCatArr = []
    for(let i =0 ; i < categoriesIds?.length ; i++){
      let dealCatObj = {
        deal_id: existingDeal.id,
        cat_id: categoriesIds[i]
      }
      dealCatArr.push(dealCatObj)
      
    }

    

    if(dealCatArr?.length){
      await DealCategoriesModel.deleteAllByColumn({ column: "deal_id", value: existingDeal.id });
      const {rows : dealCatRows,msg} =  await DealCategoriesModel.insert(dealCatArr,dbTransaction)
    }

    if(deal_categories?.length === Bit.zero){
      await DealCategoriesModel.deleteAllByColumn({ column: "deal_id", value: existingDeal.id });
    }

    if (!isEmptyField(title)) {
      title = getTrimmedValue(title, true, false);
      const [existDeal] = await DealsModel.findOneByName(title, dbTransaction);
      if (existDeal && existDeal.id != existingDeal.id)
        throw new ClientError("Deal already exist with same title")
      dealUpdateObj.title = title;
    }

    if (!isEmptyField(description)) {
      dealUpdateObj.description = description;
    }

    if (!isEmpty(type)) {
      dealUpdateObj.type = type;
    }
    

    if (!isEmptyField(start_time)) {
      let startTime = dateToMillis(start_time);
      if (isEmptyField(end_time) && (Number(existingDeal.end_time) < startTime)) {
        throw new ClientError('end time cannot be less than start time');
      }
      dealUpdateObj.start_time = startTime;
    }

    if (!isEmptyField(end_time)) {
      let endTime = dateToMillis(end_time);
      if (!isEmptyField(start_time) && (start_time > end_time)) {
        throw new ClientError('end time cannot be less than start time');
      }
      else if (isEmptyField(start_time) && (Number(existingDeal.start_time) > endTime)) {
        throw new ClientError('end time cannot be less than start time');
      }
      dealUpdateObj.end_time = endTime;
    }

    if (!isEmptyField(deal_conditions)) {
      if (!dealUpdateObj.details) {
        dealUpdateObj.details = existingDeal?.details ? { ...existingDeal.details } : {}
      }
      dealUpdateObj.details.deal_conditions = deal_conditions
    }

    if (!isEmptyField(deal_highlights)) {
      if (!dealUpdateObj.details) {
        dealUpdateObj.details = existingDeal?.details ? { ...existingDeal.details } : {}
      }
      dealUpdateObj.details.deal_highlights = deal_highlights
    }

    if (!isEmptyField(pre_select_branch)) {
      if (!dealUpdateObj.details) {
        dealUpdateObj.details = existingDeal?.details ? { ...existingDeal.details } : {}
      }
      dealUpdateObj.details.pre_select_branch = pre_select_branch
    }

    if (!isEmptyField(otp_required)) {
      if (!dealUpdateObj.details) {
        dealUpdateObj.details = existingDeal?.details ? { ...existingDeal.details } : {}
      }
      dealUpdateObj.details.otp_required = Number(otp_required)
    }

    if (!isEmptyField(campaign_id)) {
      //checking if campaign exists
      // const [campaign] = await CampaignModel.findOneByuId(campaign_id);
      const [campaign] = await CampaignModel.findRunningCampaignByColumn({ column: "uid", value: campaign_id });
      if (!campaign) {
        throw new ClientError("Invalid Campaign Id");
      }

      dealUpdateObj.campaign_id = campaign.id;
    }

    if (!isEmptyField(status)) {
      dealUpdateObj.status = status;
    }

    if (!isEmptyField(sold_out)) {
      dealUpdateObj.sold_out = sold_out;
    }

    const allowedRestaurants = [];
    if (!isEmptyField(permitted_restaurant_ids)) {
      if (permitted_restaurant_ids.length > 0) {
        const merchantId = restaurant.mer_id;
        const restaurantAllowed = await MerchantsModel.findAllRestaurantsByMerchants(merchantId);
        for (let restaurant_id of permitted_restaurant_ids) {
          const foundRestaurant = restaurantAllowed.find(elem => elem.uid == restaurant_id);
          if (!foundRestaurant) {
            throw new ClientError("Invalid restaurantId found in permitted_restaurant_ids");
          }
          allowedRestaurants.push(foundRestaurant.id);
        }
      } else {
        allowedRestaurants.push(restaurant.id)
      }
    }

    if (allowedRestaurants.length > 0) {
      if (!dealUpdateObj.dealUpdateObj) {
        dealUpdateObj.details = {}
      }
      dealUpdateObj.details.res_id = allowedRestaurants
    }

    if (!isEmptyField(share_message_deal)) {
      dealUpdateObj.details.share_message_deal = share_message_deal
    }
    if (!isEmptyField(share_message_free_deal)) {
      dealUpdateObj.details.share_message_free_deal = share_message_free_deal
    }

    if (!isEmptyField(is_locked)) {
      // if (isCurrentTimeBetween(existingDeal.start_time, existingDeal.end_time) || isCurrentTimeGreaterThan(existingDeal.end_time)) {
      //   throw new ClientError('Deal lock cannot be updated once deal is live or it has ended');
      // }

      dealUpdateObj.is_locked = is_locked;
    }

    if (!isEmptyField(lock_conditions) && Object.keys(lock_conditions).length > 0) {
      if (!dealUpdateObj.details) {
        dealUpdateObj.details = existingDeal?.details ? { ...existingDeal.details } : {}
      }
      if (!isEmptyField(lock_conditions?.booking?.restaurant_id)) {
        const [restaurant] = await RestaurantsModel.findRestaurantById(lock_conditions.booking.restaurant_id, null, dbTransaction);
        if (!restaurant) {
          throw new ClientError('Invalid Restaurant Id for deal lock conditions');
        }
        lock_conditions.booking.restaurant_id = restaurant.id;
        lock_conditions.booking.restaurant_uid = restaurant.uid;
      }
      dealUpdateObj.details.lock_conditions = lock_conditions
    }

    if(!isEmpty(free_with_nukhba_credits) && !isEmpty(existingDeal?.type) ){
      if( existingDeal?.type == DEAL_TYPE.FREE &&  free_with_nukhba_credits  == Bit.one){
        throw new ClientError('Free with nukhba credits cannot be set when deal type is free.');
      }
      dealUpdateObj.free_with_nukhba_credits = free_with_nukhba_credits
    }

    if (Object.keys(dealUpdateObj).length < 1 && (isEmptyField(deal_option) || Object.keys(deal_option).length < 1)) {
      throw new ClientError('No data to update');
    }

    const { rows } = await DealsModel.updateOneById(dealUpdateObj, existingDeal.id, dbTransaction);
    if (rows < 1) {
      throw new ServerError("Unable to update deal")
    }

    if (isTemplateAvailable && !isEmptyField(slots) && slots.length > 0) {
      // if (isDealLive) throw new ClientError("deal slot data cannot be updated as deal is live")
      let dealSlotData = [];

      if (!validateTimeSlots(slots)) {
        throw new Error("Slot validation failed.");
      }

      for (let slot of slots) {
        const { start_at, end_at, interval_in_mins } = slot;
        try {
          let slotData = isEmptyField(interval_in_mins) ? [{ startTime: start_at, endTime: end_at }] : splitTimeRange(start_at, end_at, interval_in_mins);
          slotData = slotData.map(sd => {
            return {
              ...sd,
              interval_in_mins
            }
          });
          dealSlotData.push(slotData)
        } catch (error) {
          throw new ClientError(error)
        }
      }

      //deleting existing deal slots
      // await DealSlotModel.deleteSlotsByDealId(existingDeal.id, dbTransaction);
      await DealSlotModel.updateByColumn({deleted_at: 'now()'}, 'deal_id', existingDeal.id, dbTransaction);

      //check if user deal exist

      // insert into deal slots
      const dealSlots = [];
      for (let dealSlot of dealSlotData.flat()) {
        const dealSlotObj = {
          deal_id: existingDeal.id,
          start_time: dealSlot.startTime,
          end_time: dealSlot.endTime,
          interval_in_mins: dealSlot.interval_in_mins,
        }

        dealSlots.push(dealSlotObj);
      }

      if (dealSlots.length > 0) {
        const { rows: dealSlotRows } = DealSlotModel.insert(dealSlots, dbTransaction);
        if (dealSlotRows < 1) {
          throw new ServerError("Unable to deal slots")
        }
      }
    }

    let multipleShowOnHomePage = 0;

    if(deal_option?.length > 0){

        for (let item of deal_option){
          if (!isEmpty(item?.show_on_home_page) && item?.show_on_home_page == 1) {
            multipleShowOnHomePage++;
          }
        }
    
        if (multipleShowOnHomePage < 1) {
          throw new ClientError("One of the deal option should have show_on_home_page flag enabled")
        }
    
        if (multipleShowOnHomePage > 1) {
          throw new ClientError("Multiple deal option cannot have show on home page flag enabled")
        }
    
        for (let item of deal_option) {
    
          if(isEmpty(item?.deal_option_id)){
                // add deal option if deal_option_id is not available
                const result = await DealOptionService.addDealOption({
                  ...item,
                  deal_id: existingDeal.id
              },null, dbTransaction,{enableCheckMulHomePage : false});
          }else{
              const result = await DealOptionService.updateDealOption({
                ...item,
                deal_id: existingDeal.id
            },null, dbTransaction,isDealLive, isPilot);
          }
        }
    }

    return {
      msg: 'Deal updated successfully'
    }
  }

  static async getDealList(body) {
    const {
      page = 1,
      page_size = 10,
      sort_by = 'd.sequence asc, d.id desc',
      is_paginated = true,
      order = '',
      from_date,
      to_date,
      title,
      description,
      restaurant_id,
      category_id,
      days_validity,
      status,
      device_check,
      sold_out
    } = body;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    // const response = await DealsModel.list({ sort, from_date: isEmptyField(from_date) ? from_date : dateToMillis(from_date), to_date: isEmptyField(to_date) ? to_date : dateToMillis(to_date), offset, limit, is_paginated, title, description, restaurant_id, category_id, days_validity });
    const response = await DealsModel.list({
      sort, from_date, to_date, offset, limit, is_paginated, title, description, restaurant_id, category_id, days_validity, status, device_check: !isEmptyField(device_check) ? Number(device_check) : null,
      sold_out: !isEmptyField(sold_out) ? Number(sold_out) : null
    });
    return {
      count: response.count,
      rows: await Promise.all(response.rows?.map(async elem => {
        const imageArr = [];
        for (let i = 0; i < (elem?.images || []).length; i++) {
          const [media] = await MediaModel.getOneById(elem.images[i]);
          if (media) {
            const filepath = `${media.basePath}/${media.filename}`;
            if (filepath) {
              imageArr.push({ id: elem.images[i], uid: media.uid, url: getUrlFromBucket(filepath) })
              elem.images[i] = getUrlFromBucket(filepath);
              // elem.images[i] = { id: elem.images[i], url: getUrlFromBucket(filepath) };
            } else {
              elem.images[i] = '';
            }
          } else {
            elem.images[i] = '';
          }
        }

        elem.images = elem?.images?.filter(elem => elem != '');

        const [homeImageMedia] = await MediaModel.getOneById(elem.home_image);
        let homeImage;
        if (homeImageMedia) {
          homeImage = { id: homeImageMedia.id, uid: homeImageMedia.uid, url: getUrlFromBucket(`${homeImageMedia.basePath}/${homeImageMedia.filename}`) }
        }

        let permittedRestaurant = [];
        if (!isEmptyField(elem?.details?.res_id)) {
          permittedRestaurant = await RestaurantsModel.findRestaurantIdByUIds(elem?.details?.res_id);
        }

        const PreSelectBranch = elem?.details?.pre_select_branch || null;

        let otpRequired = Bit.one
        if (!isEmptyField(elem?.details?.otp_required))
          otpRequired = Number(elem?.details?.otp_required);
        return {
          ...elem,
          slots: isEmptyField(elem?.slots) ? elem?.slots:  reverseTimeSlots(elem.slots),
          home_image: homeImage,
          otp_required: otpRequired,
          image_arr: imageArr,
          deal_conditions: elem?.details?.deal_conditions,
          deal_highlights: elem?.details?.deal_highlights,
          permitted_restaurant_ids: permittedRestaurant?.map(elem => elem.uid),
          pre_select_branch: PreSelectBranch,
          details: null,
          start_time: elem.start_time,
          end_time: elem.end_time,
          start_time_parsed: new Date(Number(elem.start_time) * 1000),
          end_time_parsed: new Date(Number(elem.end_time) * 1000),
          type_text: elem?.type === DEAL_TYPE.PAY_AT_RESTRO ? PAY_AT_RESTRO_TEXT : elem?.type
        }
      }))
    }
  }

  static async deleteDeal(body) {
    let {
      deal_id,
      user
    } = body;

    const [existingDeal] = await DealsModel.getOneByuId(deal_id);

    if (!existingDeal) {
      throw new ClientError("Deal not found")
    }

    const { rows } = await DealsModel.updateOneById({ deleted_at: 'now()' }, existingDeal.id);
    if (rows < 1) {
      throw new ServerError("Unable to delete deal")
    }

    return {
      msg: 'Deal deleted successfully'
    }
  }

  static async getUserDealList(body) {
    const {
      page = 1,
      page_size = 10,
      sort_by = 'created_at',
      is_paginated = true,
      order = 'desc',
      quantity,
      is_pilot,
      user_id,
      deal_option_id,
      deal_id,
      username,
      payment_status,
      from_date,
      to_date,
      user_email,
      user_mobile,
      restaurant_id,
      restaurant_branch_id,
      user_deal_status,
      created_at_from_date,
      created_at_to_date,
      redeemed_at_from_date,
      redeemed_at_to_date,
      type,
      booking_id,
      order_status_code
    } = body;

    //add user deal status in branch

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);
    const response = await UserDealModel.list({
      sort,
      offset,
      limit,
      is_paginated,
      quantity,
      is_pilot: isEmptyField(is_pilot) ? null : Number(is_pilot),
      user_id,
      deal_option_id,
      deal_id,
      username,
      payment_status,
      from_date: isEmptyField(from_date) ? from_date : dateToMillis(from_date),
      to_date: isEmptyField(to_date) ? to_date : dateToMillis(to_date),
      user_email,
      user_mobile,
      restaurant_id,
      restaurant_branch_id,
      user_deal_status,
      created_at_from_date,
      created_at_to_date,
      redeemed_at_from_date,
      redeemed_at_to_date,
      type,
      booking_id,
      order_status_code
    });

    return {
      count: response.count,
      rows: response.rows?.map(elem => {
        const capturedDealData = elem?.user_deal_details?.deal_detail;
        const capturedDealOptionData = capturedDealData?.deal_options;
        let orderStatusDetails = elem?.payment_other_details?.payment_info?.order?.status || { "code": 1, "text": "Pending" }
        delete elem.user_deal_details;
        let usrDlStatus = elem.user_deal_status;
        if (Number(elem.is_expired) && usrDlStatus == UserDealStatus.payment_completed) {
          usrDlStatus = UserDealStatus.expired;
        }
        if (elem?.payment_status == PaymentStatus.completed.value && !elem?.ref_txn_id) {
          orderStatusDetails = { "code": OrderStatusCode.paid, "text": "Paid" }
        }
        const end_time = new Date(elem.end_time * 1000)
        let end_time_timestamp = end_time.toISOString()
        const returnObj = {
          ...elem,
          order_status_code: elem?.order_status_code ?? '',
          end_time: end_time_timestamp,
          total_price: Number(capturedDealOptionData?.actual_price) * Number(elem.quantity),
          discounted_price: Number(capturedDealOptionData?.discounted_price) * Number(elem.quantity),
          payment_status: {
            value: elem?.payment_status,
            key: Object.values(PaymentStatus)?.find(ps => ps.value == elem?.payment_status)?.key || ''
          },
          user_deal_status: {
            value: usrDlStatus,
            key: getKeyByValue(UserDealStatus, usrDlStatus) || '',
          },
          payment_details: orderStatusDetails,
          txn_details: elem?.payment_other_details?.payment_info?.order?.transaction || {},
          selected_restaurant:{
            branch_name: elem?.selected_restaurant?.branch_name
          },
          slot:{
            time: elem?.slot_interval_in_mins ? `${elem?.slot_start_time}` : elem?.slot_start_time ? `${elem?.slot_start_time} - ${elem?.slot_end_time}` : null ,
            interval_in_mins: elem?.slot_interval_in_mins
          }
        }
        delete returnObj['slot_interval_in_mins'];
        delete returnObj['slot_start_time'];
        delete returnObj['slot_start_time'];


        delete returnObj['payment_other_details'];

        return returnObj
      }),
    }
  }

  static async removeImages(body) {
    const { deal_image_ids: dealImageIds, deal_id: dealId } = body;

    const [existingDeal] = await DealsModel.getOneByuId(dealId);

    if (!existingDeal) {
      throw new ClientError("Deal not found")
    }

    let newDealImageIds = [];

    if (dealImageIds && dealImageIds.length) {
      const existDealImageIds = existingDeal?.images || [];
      newDealImageIds = existDealImageIds?.filter(el => !dealImageIds.includes(el)) || [];
    }

    if (newDealImageIds.length) {
      await DealsModel.updateImages({ images: newDealImageIds.join(",") }, existingDeal.id);
      // await MediaService.removeFilesByIds([...dealImageIds, ...restImageIds, ...logoImageIds]);
    }

    return { msg: "Images removed successfully" };
  }

  static async updateDealSequence(body) {
    const { deals, user, dbTransaction } = body;

    for (let deal of deals) {
      const [existingDeal] = await DealsModel.getOneByuId(deal.id, dbTransaction);
      if (!existingDeal) throw new ClientError("Invalid deal")
      const { rows } = await DealsModel.updateOneById({ sequence: deal.sequence }, existingDeal.id, dbTransaction);
      if (rows < 1) {
        throw new ServerError("Unable to update deal")
      }
    }

    return {
      msg: 'Deal Sequence updated'
    }
  }

  static async checkRestDetails(body, dealData) {
    let {
      deal_id,
      title,
      description,
      images,
      home_image,
      start_time,
      end_time,
      restaurant_id,
      category_id,
      days_validity,
      deal_conditions,
      deal_highlights,
      otp_required,
      deal_option,
      type,
      is_pilot,
      campaign_id,
      status,
      user,
      dbTransaction,
    } = body;

    let message = "cannot be updated";

    if (dealData.is_pilot == Bit.one) {
      if (!isEmptyField(restaurant_id)) {
        throw new ClientError(`Deal Restaurant ${message}`)
      }
      if (!isEmptyField(start_time)) {
        throw new ClientError(`Start time ${message}`)
      }
      if (!isEmptyField(end_time)) {
        throw new ClientError(`End time ${message}`)
      }
      if (!isEmptyField(category_id)) {
        throw new ClientError(`Category ${message}`)
      }
      if (!isEmptyField(campaign_id)) {
        throw new ClientError(`Deal campaign ${message}`)
      }
      if (!isEmptyField(is_pilot)) {
        throw new ClientError(`Deal mode ${message}`)
      }
      if (!isEmptyField(type)) {
        throw new ClientError(`Deal type ${message}`)
      }
      if (!isEmptyField(days_validity)) {
        throw new ClientError(`Days validity ${message}`)
      }
      if (!isEmptyField(images)) {
        throw new ClientError(`Deal images ${message}`)
      }
      if (!isEmptyField(home_image)) {
        throw new ClientError(`Home image ${message}`)
      }
      if (!isEmptyField(otp_required)) {
        throw new ClientError(`Otp Required ${message}`)
      }
      if (!isEmptyField(deal_option) && deal_option.length > 1) {
        for (let option of deal_option) {
          let {
            title,
            actual_price,
            discounted_price,
            max_use,
            deal_option_id,
            show_on_home_page,
            uses_per_user,
          } = option;

          if (!isEmptyField(show_on_home_page) && show_on_home_page == 1) {
            throw new ClientError(`Offer home page flag ${message}`)
          }
          // if (!isEmptyField(title)) {
          //   throw new ClientError(`Deal Options Title ${message}`)
          // }
          if (!isEmptyField(actual_price)) {
            throw new ClientError(`Offer actual price ${message}`)
          }
          if (!isEmptyField(discounted_price)) {
            throw new ClientError(`Offer discounted price ${message}`)
          }
          if (!isEmptyField(max_use)) {
            throw new ClientError(`Offer available deals ${message}`)
          }
          if (!isEmptyField(show_on_home_page)) {
            throw new ClientError(`Deal Options ${message}`)
          }
          if (!isEmptyField(uses_per_user)) {
            throw new ClientError(`Offer max deal per user ${message}`)
          }
        }
      }
    } else {
      // if (!isEmptyField(title)) {
      //   throw new ClientError(`Home image ${message}`)
      // }
      // if (!isEmptyField(description)) {
      //   throw new ClientError(`Description ${message}`)
      // }
      // if (!isEmptyField(deal_highlights)) {
      //   throw new ClientError(`Deal highlights ${message}`)
      // }
      // if (!isEmptyField(deal_conditions)) {
      //   throw new ClientError(`Deal conditions ${message}`)
      // }
      // if (!isEmptyField(status)) {
      //   throw new ClientError(`Status ${message}`)
      // }
      if (!isEmptyField(restaurant_id)) {
        throw new ClientError(`Deal Restaurant ${message}`)
      }
      if (!isEmptyField(start_time)) {
        throw new ClientError(`Start time ${message}`)
      }
      if (!isEmptyField(end_time)) {
        throw new ClientError(`End time ${message}`)
      }
      if (!isEmptyField(days_validity)) {
        throw new ClientError(`Days validity ${message}`)
      }
      if (!isEmptyField(category_id)) {
        throw new ClientError(`Category ${message}`)
      }
      if (!isEmptyField(campaign_id)) {
        throw new ClientError(`Deal campaign ${message}`)
      }
      if (!isEmptyField(is_pilot)) {
        throw new ClientError(`Deal mode ${message}`)
      }
      if (!isEmptyField(type)) {
        throw new ClientError(`Deal type ${message}`)
      }
      if (!isEmptyField(images)) {
        throw new ClientError(`Deal images ${message}`)
      }
      if (!isEmptyField(home_image)) {
        throw new ClientError(`Home image ${message}`)
      }
      if (!isEmptyField(otp_required)) {
        throw new ClientError(`Otp Required ${message}`)
      }

      if (!isEmptyField(deal_option) && deal_option.length > 1) {
        for (let option of deal_option) {
          let {
            title,
            actual_price,
            discounted_price,
            max_use,
            deal_option_id,
            show_on_home_page,
            uses_per_user,
          } = option;

          if (!isEmptyField(show_on_home_page) && show_on_home_page == 1) {
            throw new ClientError(`Offer home page flag ${message}`)
          }
          // if (!isEmptyField(title)) {
          //   throw new ClientError(`Deal Options Title ${message}`)
          // }
          if (!isEmptyField(actual_price)) {
            throw new ClientError(`Offer actual price ${message}`)
          }
          if (!isEmptyField(discounted_price)) {
            throw new ClientError(`Offer discounted price ${message}`)
          }
          if (!isEmptyField(max_use)) {
            throw new ClientError(`Offer available deals ${message}`)
          }
          if (!isEmptyField(show_on_home_page)) {
            throw new ClientError(`Deal Options ${message}`)
          }
          if (!isEmptyField(uses_per_user)) {
            throw new ClientError(`Offer max deal per user ${message}`)
          }
        }
      }
    }

    return;
  }

  static async dealCategoryMigration(body) {

    // get all deals id
    const {count,rows} = await DealsModel.getAllDealForScript();
    const dealsRows = rows

    let dealObjArr = []
    let countExist = 0
    for(let i= 0 ; i < dealsRows?.length ; i++){
      const dealItem = dealsRows[i]
      let dealCatObj = {
        deal_id: dealItem.id,
        cat_id: dealItem?.category_id
      }
      if(dealItem?.id && dealItem?.category_id ){
        // check if deal cat row already exist
        const dealCatExist = await DealCategoriesModel.checkDealCatExist(dealCatObj)
        if(!isEmptyField(dealCatExist)){
          countExist++
        }
        if(isEmptyField(dealCatExist)){
          dealObjArr.push(dealCatObj)
        }
      }
      
    }

    let insertRes
    // bulk insert of deal categories items
    if(dealObjArr?.length > 0){
      insertRes = await DealCategoriesModel.insert(dealObjArr)
    }

    return {
      count,
      existedDealCat : countExist,
      insertRes,
      rows
    }
   
  }

}
module.exports = DealService;
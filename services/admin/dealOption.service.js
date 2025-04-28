const MediaModel = require("../../models/mysql/media.model.js");
const { getUrlFromBucket } = require("../../utils/s3.js");
const ClientError = require("../../error/clientError.js");
const { isEmptyField, checkMandatoryFieldsV1, getTrimmedValue } = require("../../utils/common.js");
const DealsModel = require("../../models/mysql/deals.model.js");
const ServerError = require("../../error/serverError.js");
const DealOptionModel = require("../../models/mysql/dealsOption.model.js");
const UserDealModel = require("../../models/mysql/userDeal.model.js");
const { Bit, DEAL_TEMPLATE, DEAL_COMMISSION_TYPE } = require("../../constants/database.js");

class DealOptionService {

  static async addDealOption(body, bodyArr, dbTransaction,otherData) {
    let enableCheckMulHomePage = otherData?.enableCheckMulHomePage
    if(enableCheckMulHomePage !== false){
      enableCheckMulHomePage = true
    }

    if (isEmptyField(bodyArr) || bodyArr.length < 1) {
      body = [body]
    } else {
      body = bodyArr;
    }

    if (isEmptyField(body) || body.length < 1) {
      throw new ClientError("Options is required")
    }

    if (isEmptyField(body[0]?.deal_id)) {
      throw new ClientError("deal_id not found")
    }

    const [existingDeal] = await DealsModel.getOneById(body[0].deal_id, dbTransaction);

    if (!existingDeal) {
      throw new ClientError("Deal not found");
    }

    let multipleShowOnHomePage = 0;
    let sameTitleFound = 0;
    let previousTitle;
    for (let b of body) {
      let {
        title,
        actual_price,
        discounted_price,
        max_use,
        show_on_home_page,
        uses_per_user,
        max_qty_pr_purchase,
        pax_comission_type,
        pax_details,
      } = b;

      if (!isEmptyField(show_on_home_page) && show_on_home_page == 1) {
        multipleShowOnHomePage++;
      }

      if (multipleShowOnHomePage > 1) {
        throw new ClientError("Multiple deal option cannot have show_on_home_page flag enabled")
      }

      let dealTrimmedTitle = getTrimmedValue(title, true, false)
      if (dealTrimmedTitle == existingDeal.title || (previousTitle && dealTrimmedTitle == previousTitle)) {
        sameTitleFound = sameTitleFound + 1;
      }
      previousTitle = title;

      if (sameTitleFound > 0) {
        throw new ClientError("Deal and offers cannot have same title")
      }

      if (Number(actual_price) < Number(discounted_price)) {
        throw new ClientError("Discount amount should not be greater than actual amount")
        // throw new ClientError("Discount amount should not be greater than or equal to actual amount")
      }

      if (Number(uses_per_user) > Number(max_use)) {
        throw new ClientError("Uses per user should be less than equal to max use");
      }

      b.deal_id = existingDeal.id;

      const dealOptionObj = {
        title,
        actual_price,
        discounted_price,
        max_use,
        deal_id: b.deal_id,
        show_on_home_page,
        uses_per_user
      }

      if (!isEmptyField(max_qty_pr_purchase)) {
        dealOptionObj.max_qty_pr_purchase = max_qty_pr_purchase;
      }

      if (!isEmptyField(pax_comission_type)) {
        // if (existingDeal.template == DEAL_TEMPLATE.WITHOUT_SLOT) throw new ClientError(`Deal template should be ${DEAL_TEMPLATE.WITH_SLOT} when comission type is passed in deal option`)
        if (isEmptyField(pax_details) || Object.keys(pax_details).length < 1) throw new ClientError("pax details is required when comission type is not null")
        if (Object.keys(pax_details).length > 1) throw new ClientError("pax details should have one only object")
        dealOptionObj.pax_comission_type = pax_comission_type;
      }

      if (!isEmptyField(pax_details) && Object.keys(pax_details).length > 0) {
        // if (existingDeal.template == DEAL_TEMPLATE.WITHOUT_SLOT) throw new ClientError(`Deal template should be ${DEAL_TEMPLATE.WITH_SLOT} when pax details is passed in deal option`)
        if (isEmptyField(pax_comission_type)) throw new ClientError("comission type is required when pax details is not null");
        if (Object.keys(pax_details).length > 1) throw new ClientError("pax details should have one only object")
        if (pax_comission_type == DEAL_COMMISSION_TYPE.FIXED_PER_PAX) {
          if (isEmptyField(pax_details?.fixed_per_pax)) throw new ClientError(`fixed per pax is required when commission type is ${DEAL_COMMISSION_TYPE.FIXED_PER_PAX}`);
          if(discounted_price != pax_details.fixed_per_pax) throw new ClientError('fixed per pax should be equal to discounted amount')
        } else if (pax_comission_type == DEAL_COMMISSION_TYPE.VARIES_PER_PAX) {
          if (isEmptyField(pax_details?.varies_per_pax) || pax_details.varies_per_pax?.length < 1) throw new ClientError(`varies per pax is required and should be non empty array when commission type is ${DEAL_COMMISSION_TYPE.VARIES_PER_PAX}`);
          if(discounted_price != pax_details.varies_per_pax?.[0].amount) throw new ClientError('amount of first element of varies per max should be equal to discounted amount')
        } else if (pax_comission_type == DEAL_COMMISSION_TYPE.FIXED_PER_BOOKING) {
          if (isEmptyField(pax_details?.fixed_per_booking)) throw new ClientError(`fixed per booking is required when commission type is ${DEAL_COMMISSION_TYPE.FIXED_PER_BOOKING}`);
          if(discounted_price != pax_details.fixed_per_booking) throw new ClientError('fixed per booking should be equal to discounted amount')
        }
        dealOptionObj.pax_details = pax_details;
      }

      checkMandatoryFieldsV1({
        title: dealOptionObj.title,
        actual_price: dealOptionObj.actual_price,
        discounted_price: dealOptionObj.discounted_price,
        max_use: dealOptionObj.max_use,
        deal_id: dealOptionObj.deal_id,
        show_on_home_page: dealOptionObj.show_on_home_page,
        uses_per_user: dealOptionObj.uses_per_user,
      });

      // dealOptionObjArr.push(dealOptionObj)
      const { rows } = await DealOptionModel.insert(dealOptionObj, dbTransaction);
      if (rows < 1) {
        throw new ServerError("Unable to add deal option")
      }
    }

    if(enableCheckMulHomePage == true){
      if (multipleShowOnHomePage < 1) {
        throw new ClientError("One of the deal option should have show_on_home_page flag enabled")
      }
    }
    

    return {
      msg: 'Deal option added successfully'
    }
  }

  static async updateDealOption(body, bodyArr, dbTransaction, isDealLive, isDealPilot) {

    if (isEmptyField(bodyArr) || bodyArr.length < 1) {
      body = [body]
    } else {
      body = bodyArr;
    }

    if (isEmptyField(body) || body.length < 1) {
      throw new ClientError("Options is required")
    }

    const bulkUpdate = [];
    let multipleShowOnHomePage = 0;
    let sameTitleFound = 0;
    let previousTitle;
    for (let b of body) {
      let {
        title,
        actual_price,
        discounted_price,
        max_use,
        deal_option_id,
        show_on_home_page,
        uses_per_user,
        max_qty_pr_purchase,
        pax_comission_type,
        pax_details,
      } = b;
      if (!isEmptyField(show_on_home_page) && show_on_home_page == 1) {
        multipleShowOnHomePage++;
      }

      // if (multipleShowOnHomePage > 1) {
      //   throw new ClientError("Multiple deal option cannot have show on home page flag enabled")
      // }

      if (Number(actual_price) < Number(discounted_price)) {
        throw new ClientError("Discount amount should not be greater than actual amount")
        // throw new ClientError("Discount amount should not be greater than or equal to actual amount")
      }

      const [existingDealOption] = await DealOptionModel.getOneByuId(deal_option_id, dbTransaction);
      if (!existingDealOption) {
        throw new ClientError("Deal option not found")
      }

      const [existingDeal] = await DealsModel.getOneById(existingDealOption.deal_id, dbTransaction);

      if (!existingDeal) {
        throw new ClientError("Deal not found")
      }

      let dealTrimmedTitle = getTrimmedValue(title, true, false)
      if (dealTrimmedTitle == existingDeal.title || (previousTitle && dealTrimmedTitle == previousTitle)) {
        sameTitleFound++;
      }
      previousTitle = title;

      if (sameTitleFound > 0) {
        throw new ClientError("Deal and offers cannot have same title")
      }

      if (isDealPilot == Bit.zero) {
        // if (!isEmptyField(actual_price)) {
        //   throw new ClientError("For live deal, actual amount cannot be updated for any option");
        // }

        // if (!isEmptyField(discounted_price)) {
        //   throw new ClientError("For live deal, discounted amount cannot be updated for any option");
        // }

        // if (!isEmptyField(max_use)) {
        //   throw new ClientError("For live deal, total available deals cannot be updated for any option");
        // }

        // if (!isEmptyField(uses_per_user)) {
        //   throw new ClientError("For live deal, max deal per user cannot be updated for any option");
        // }
      }

      const dealOptionObj = {};

      if (!isEmptyField(max_qty_pr_purchase)) {
        dealOptionObj.max_qty_pr_purchase = max_qty_pr_purchase;
      }

      if (!isEmptyField(pax_comission_type)) {
        // if (existingDeal.template == DEAL_TEMPLATE.WITHOUT_SLOT) throw new ClientError(`Deal template should be ${DEAL_TEMPLATE.WITH_SLOT} when comission type is passed in deal option`)
        if (isEmptyField(pax_details) || Object.keys(pax_details).length < 1) throw new ClientError("pax details is required when comission type is not null")
        if (Object.keys(pax_details).length > 1) throw new ClientError("pax details should have one only object")
        dealOptionObj.pax_comission_type = pax_comission_type;
      }

      if (!isEmptyField(pax_details) && Object.keys(pax_details).length > 0) {
        // if (existingDeal.template == DEAL_TEMPLATE.WITHOUT_SLOT) throw new ClientError(`Deal template should be ${DEAL_TEMPLATE.WITH_SLOT} when pax details is passed in deal option`)
        if (isEmptyField(pax_comission_type)) throw new ClientError("comission type is required when pax details is not null");
        if (Object.keys(pax_details).length > 1) throw new ClientError("pax details should have one only object")
        if (pax_comission_type == DEAL_COMMISSION_TYPE.FIXED_PER_PAX) {
          if (isEmptyField(pax_details?.fixed_per_pax)) throw new ClientError(`fixed per pax is required when commission type is ${DEAL_COMMISSION_TYPE.FIXED_PER_PAX}`);
          if(discounted_price != pax_details?.fixed_per_pax) throw new ClientError('fixed per pax should be equal to discounted amount')
        } else if (pax_comission_type == DEAL_COMMISSION_TYPE.VARIES_PER_PAX) {
          if (isEmptyField(pax_details?.varies_per_pax) || pax_details.varies_per_pax?.length < 1) throw new ClientError(`varies per pax is required and should be non empty array when commission type is ${DEAL_COMMISSION_TYPE.VARIES_PER_PAX}`);
          if(discounted_price != pax_details?.varies_per_pax?.[0].amount) throw new ClientError('amount of first element of varies per max should be equal to discounted amount')
        } else if (pax_comission_type == DEAL_COMMISSION_TYPE.FIXED_PER_BOOKING) {
          if (isEmptyField(pax_details?.fixed_per_booking)) throw new ClientError(`fixed per booking is required when commission type is ${DEAL_COMMISSION_TYPE.FIXED_PER_BOOKING}`);
          if(discounted_price != pax_details?.fixed_per_booking) throw new ClientError('fixed per booking should be equal to discounted amount')
        }
        dealOptionObj.pax_details = pax_details;
      }

      if (!isEmptyField(title)) {
        dealOptionObj.title = title;
      }

      if (!isEmptyField(actual_price)) {
        dealOptionObj.actual_price = actual_price;
      }

      if (!isEmptyField(discounted_price)) {
        dealOptionObj.discounted_price = discounted_price;
      }

      if (!isEmptyField(max_use)) {
        dealOptionObj.max_use = max_use;
      }

      if (!isEmptyField(show_on_home_page)) {
        dealOptionObj.show_on_home_page = show_on_home_page;
      }

      if (!isEmptyField(uses_per_user)) {
        dealOptionObj.uses_per_user = uses_per_user;
      }

      const _maxUse = max_use || existingDealOption.max_use;
      const _usesPerUser = uses_per_user || existingDealOption.uses_per_user;

      if (Number(_usesPerUser) > Number(_maxUse)) {
        throw new ClientError("Uses per user should be less than equal to max use");
      }

      const keysToUpdate = Object.keys(dealOptionObj);

      if (keysToUpdate.length < 1) {
        throw new ClientError("No data to update")
      }
      // if (isDealPilot == Bit.zero && (keysToUpdate.includes("actual_price") || keysToUpdate.includes("discounted_price") || keysToUpdate.includes("max_use"))) {
      //   // const [userDeal] = await UserDealModel.getOneByDealId(existingDeal.id, dbTransaction);
      //   if (isDealLive) {
      //     throw new ClientError("Field like actual price, discounted price and max use cannot be edited while the deal is live");
      //   }
      // }

      bulkUpdate.push(DealOptionModel.updateOneById(dealOptionObj, existingDealOption.id, dbTransaction))
    }

    // if (multipleShowOnHomePage < 1) {
    //   throw new ClientError("One of the deal option should have show on home page flag enabled")
    // }

    await Promise.all(bulkUpdate)

    return {
      msg: 'Deal option updated successfully'
    }
  }

  static async getDealOptionList(body) {
    const {
      page = 1,
      page_size = 10,
      sort_by = 'created_at',
      is_paginated = true,
      order = 'desc',
      actual_price,
      discounted_price,
      title,
      max_use,
      deal_id
    } = body;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const response = await DealOptionModel.list({ sort, offset, limit, is_paginated, actual_price, discounted_price, title, max_use, deal_id });
    return {
      count: response.count,
      rows: response.rows,
    }
  }

  static async deleteDealOption(body) {
    let {
      deal_option_id,
      user
    } = body;

    const [existingDealOption] = await DealOptionModel.getOneByuId(deal_option_id);
    if (!existingDealOption) {
      throw new ClientError("Deal option not found")
    }

    const { rows } = await DealOptionModel.updateOneById({ deleted_at: 'now()' }, existingDealOption.id);
    if (rows < 1) {
      throw new ServerError("Unable to delete deal option")
    }

    return {
      msg: 'Deal option deleted successfully'
    }
  }

}
module.exports = DealOptionService;
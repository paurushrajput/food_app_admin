const ClientError = require("../../error/clientError");
const ServerError = require("../../error/serverError");
const CouponsModel = require("../../models/mysql/coupons.model");
const UsersModel = require("../../models/mysql/users.model");
const MediaModel = require("../../models/mysql/media.model");
const DealModel = require("../../models/mysql/deals.model");
const { isEmptyField, getTrimmedValue, checkMandatoryFieldsV1 } = require("../../utils/common");
const {
  CAMPAIGN_ACTION,
  CouponType,
  USER_TYPE,
  CAMPAIGN_COMMISSION_TYPE,
  Status,
  Pagination,
  Bit,
  DIALOG_ACTION_TYPE,
  DIALOG_USER_TYPE,
  DIALOG_USER_READ,
  DIALOG_TYPE
} = require("../../constants/database");
const CampaignModel = require("../../models/mysql/campaign.model");
const { getKeyByValue } = require("../../utils/general");
const { getEpoch, formatDate, formatDateOnly, calculateDateDifference } = require("../../utils/moment");
const DialogModel = require("../../models/mysql/dialog.model");
const { createEpochDate } = require("../../utils/date");
const { DIALOG_ADDED, DUPLICATE_DIALOG_TITLE, DIALOG_ADD_ERROR } = require("../../constants/messages");
const TournamentsModel = require("../../models/mysql/tournaments.model");
const RestaurantsModel = require("../../models/mysql/restaurants.model");
const MESSAGES = require("../../constants/messages");
const DialogUserModel = require("../../models/mysql/dialogUser.model");
const CouponRedeemModel = require("../../models/mysql/couponRedeem.model");
const DatabaseError = require("../../error/databaseError");
const { sendPushNotificationToTopic, sendPushNotificationToDevice } = require("../../utils/pushNotification");
const { NotificationImageType } = require("../../constants/variables");
const { getUrlFromBucket } = require("../../utils/s3.js");

class DialogService {
  /**
   * list campaigns
   * @param {string} body - pagination values.
   */
  static async get(data) {
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
      status,
    } = data;

    if (isEmptyField(sort_by)) sort_by = Pagination.defaultSortColumn;
    if (isEmptyField(order)) order = Pagination.defaultOrder;
    if (isEmptyField(page)) page = Pagination.defaultPage;
    if (isEmptyField(page_size)) page_size = Pagination.pageSize;
    if (getTrimmedValue(is_paginated) === "false") is_paginated = false;
    else is_paginated = true;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const response = await DialogModel.list({
      sort,
      limit,
      offset,
      is_paginated,
      keyword,
      from_date,
      to_date,
      id,
      status,
    });

    return {
      count: response.count,
      rows: response.rows?.map((each) => ({
        ...each,
        image: getUrlFromBucket(each.image)
      })),
    };
  }

  static async add(data) {
    let { title, message, button_name = "Submit", action, action_type, start_time, end_time, status = Bit.one, user_type, res_id, user_ids, campaign_id, coupon_id, is_coupon_used, on_boarding_start, on_boarding_end, type = DIALOG_TYPE.DIALOG, image, is_close, deal_id, dbTransaction } = data;

    if (type == DIALOG_TYPE.NOTIFICATION) {
      const response = await DialogService.sendNotification(data);
      return response;
    } else {
      checkMandatoryFieldsV1({
        start_time: start_time,
        end_time: end_time
      })
    }

    action_type = Number(action_type)

    if (Number(end_time) < createEpochDate())
      throw new ClientError(`End time cannot be less than current time`);

    if (Number(end_time) < Number(start_time))
      throw new ClientError(`End time cannot be less than Start time`);

    if(isEmptyField(is_close) && isEmptyField(button_name)){
      throw new ClientError(`Either button name or Close button value is required`);
    }

    if(!isEmptyField(is_close) && Number(is_close) == 0 && isEmptyField(button_name)){
      throw new ClientError(`Button name is required when close button is disabled`);
    }

    let numOfFilters = 0

    const details = {
      button_name,
      action,
      action_type: Number(action_type),
    }

    let getMediaId
    if (!isEmptyField(image)) {
      [getMediaId] = await MediaModel.getOneByuId(image);

      if (!getMediaId)
        throw new ClientError("image not found in media");

    }

    if (!isEmptyField(campaign_id)) {
      numOfFilters++
      if (isEmptyField(is_coupon_used)) {
        throw new ClientError("Coupon used flag is required field")
      }
      details.filters = {
        ...details.filters,
        campaign_id,
        is_coupon_used
      }
    }

    if (!isEmptyField(coupon_id)) {
      numOfFilters++
      if (isEmptyField(is_coupon_used)) {
        throw new ClientError("Coupon used flag is required field")
      }
      details.filters = {
        ...details.filters,
        coupon_id,
        is_coupon_used
      }
    }

    if (!isEmptyField(on_boarding_start) || !isEmptyField(on_boarding_end)) {
      on_boarding_start = formatDateOnly(on_boarding_start);
      on_boarding_end = formatDateOnly(on_boarding_end);
      const diff = calculateDateDifference(on_boarding_start, on_boarding_end);
      if (diff > 0) {
        throw new ClientError("Onboarding end date should be greater than Onboarding start date")
      }

      details.filters = {
        ...details.filters,
        on_boarding_start,
        on_boarding_end
      }
    }

    if (!isEmptyField(user_ids) && user_ids.length > 0) {
      details.filters = {
        ...details.filters,
        user_ids,
      }
    }

    if (numOfFilters > 1) {
      throw new ClientError("Please pass either campaign code or coupon code at a time")
    } else {
      if (numOfFilters == 1) {
        if (user_type != DIALOG_USER_TYPE.SPECIFIC_USER) {
          throw new ClientError("User Type should be of all user type when filter condition is applied")
        }
        if (user_ids && user_ids.length > 0) {
          throw new ClientError("User Ids is not required when filter condition is applied")
        }
      } else {
        if (isEmptyField(on_boarding_start) && isEmptyField(on_boarding_end)) {
          if ((!user_ids || user_ids.length < 1) && user_type == DIALOG_USER_TYPE.SPECIFIC_USER) {
            throw new ClientError("User Ids is required when campaign code or coupon code is not applied")
          }
        }
      }
    }

    //GET duplicacy check of title
    const resArray = await DialogModel.findRunningDialogByColumn('title', title, dbTransaction)
    if (resArray.length >= 1) {
      throw new ClientError(DUPLICATE_DIALOG_TITLE)
    }

    if (Number(action_type) == DIALOG_ACTION_TYPE.RESTAURANT.action_key) {
      if (!res_id)
        throw new ClientError('Restaurant ID is required');
      let [restaurant] = await RestaurantsModel.findRestaurantById(res_id, null, dbTransaction);
      if (!restaurant) {
        throw new ClientError('Invalid Restaurant ID');
      }
      details.action_screen = DIALOG_ACTION_TYPE.RESTAURANT.action_key;
      details.action = `${DIALOG_ACTION_TYPE.RESTAURANT.value}&res_id=${restaurant.uid}`;
      details.res_id = restaurant.id;
      details.res_uid = restaurant.uid;
    } else if (Number(action_type) == DIALOG_ACTION_TYPE.GAME.action_key) {
      const liveTournamentPromise = TournamentsModel.getLiveTournamentDetails(dbTransaction) || [];
      const completedTournamentPromise = TournamentsModel.getCompletedTournamentDetails(dbTransaction) || [];
      const [[liveTournament], [completedTournament]] = await Promise.all([liveTournamentPromise, completedTournamentPromise])
      if (!liveTournament && !completedTournament) {
        throw new ClientError('No active or completed tournament found');
      }
      let tournament = liveTournament || completedTournament;
      details.action_screen = DIALOG_ACTION_TYPE.GAME.action_key;
      details.action = `${DIALOG_ACTION_TYPE.GAME.value}&tournament_id=${tournament.uid}&game_id=${tournament.game_id}`;
      details.tournament_id = tournament.id;
      details.tournament_uid = tournament.uid;
    } else if (Number(action_type) == DIALOG_ACTION_TYPE.DEAL.action_key) {
      if (!deal_id){
        details.action_screen = DIALOG_ACTION_TYPE.DEAL.action_key;
        details.action = ``;
      } else {
        let [deal] = await DealModel.getOneByuId(deal_id, null, dbTransaction);
        if (!deal) {
          throw new ClientError('Invalid Deal ID');
        }
        details.action_screen = DIALOG_ACTION_TYPE.DEAL.action_key;
        details.action = `${DIALOG_ACTION_TYPE.DEAL.value}&deal_id=${deal.uid}`;
        details.deal_id = deal.id;
        details.deal_uid = deal.uid;
      }
    }

    const payload = {
      title,
      message,
      details,
      start_time,
      end_time,
      status,
      user_type,
      image_id: getMediaId?.id,
      is_image_close: Number(is_close)
    }

    const { rows } = await DialogModel.insert(payload, dbTransaction);
    if (rows < 1) {
      throw new DatabaseError("Unable to add dialog")
    }
    const [dialog] = await DialogModel.findRunningDialogByTitle(title, dbTransaction)

    const dialogUserArr = [];
    if (Number(user_type) == Bit.zero) {

      let dialogUsers;

      if (!isEmptyField(coupon_id)) {
        const [coupon] = await CouponsModel.findOneByuId(coupon_id, dbTransaction);
        if (!coupon) {
          throw new ClientError("Coupon not found");
        }

        //checking if expiration time is valid
        if (Number(coupon.expiration_at) <= Math.floor(Date.now() / 1000)) {
          throw new ClientError("Coupon has been expired");
        }

        dialogUsers = await getCouponRedeemUser({ coupon_id: coupon.id, is_coupon_used, on_boarding_start: on_boarding_start, on_boarding_end: on_boarding_end, dbTransaction });

      } else if (!isEmptyField(campaign_id)) {
        const [campaign] = await CampaignModel.findOneByuId(campaign_id, dbTransaction);

        await validateCampaign(campaign);

        // const [coupon] = await CouponsModel.findOneById(campaign.coupon_id, dbTransaction);
        // if (!coupon) {
        //   throw new ClientError("Coupon not found");
        // }

        // //checking if expiration time is valid
        // if (Number(coupon.expiration_at) <= Math.floor(Date.now() / 1000)) {
        //   throw new ClientError("Campaign coupon has been expired");
        // }

        // dialogUsers = await getCouponRedeemUser({ coupon_id: campaign.coupon_id, is_coupon_used, on_boarding_start: on_boarding_start, on_boarding_end: on_boarding_end, dbTransaction });
        dialogUsers = await CampaignModel.findCampaignUser({ campaign_id: campaign.id, on_boarding_start: on_boarding_start, on_boarding_end: on_boarding_end, dbTransaction });

      } else if (!isEmptyField(on_boarding_start) || !isEmptyField(on_boarding_end)) {
        dialogUsers = await UsersModel.findUserWithOnBoardingDate(on_boarding_start, on_boarding_end, dbTransaction);
      } else {
        dialogUsers = await UsersModel.findUsersWithMultipleUid(user_ids, dbTransaction);
      }

      for (let user of dialogUsers) {
        dialogUserArr.push({
          dialog_id: dialog.id,
          user_id: user.id,
          is_read: DIALOG_USER_READ.NOT_READ
        })
      }

      if (dialogUserArr.length > 0) {
        //inserting user specific dialog user
        const { rows } = await DialogUserModel.insert(dialogUserArr, dbTransaction);
        if (rows < 1) {
          throw new DatabaseError("Unable to add dialog user")
        }
      }
    }

    return { msg: DIALOG_ADDED }
  }

  static async sendNotification(data) {
    let { title, message, button_name = "Submit", action, action_type, start_time, end_time, status = Bit.one, user_type, res_id, user_ids, campaign_id, coupon_id, is_coupon_used, on_boarding_start, on_boarding_end, type, dbTransaction } = data;

    action_type = Number(action_type)

    let numOfFilters = 0

    const details = {
      button_name,
      action,
      action_type: Number(action_type),
    }

    if (!isEmptyField(campaign_id)) {
      numOfFilters++
      if (isEmptyField(is_coupon_used)) {
        throw new ClientError("Coupon code flag is required field")
      }
      details.filters = {
        ...details.filters,
        campaign_id,
        is_coupon_used
      }
    }

    if (!isEmptyField(coupon_id)) {
      numOfFilters++
      if (isEmptyField(is_coupon_used)) {
        throw new ClientError("Coupon code flag is required field")
      }
      details.filters = {
        ...details.filters,
        coupon_id,
        is_coupon_used
      }
    }

    if (!isEmptyField(on_boarding_start) || !isEmptyField(on_boarding_end)) {
      on_boarding_start = formatDateOnly(on_boarding_start);
      on_boarding_end = formatDateOnly(on_boarding_end);
      const diff = calculateDateDifference(on_boarding_start, on_boarding_end);
      if (diff > 0) {
        throw new ClientError("Onboarding end date should be greater than on borading start date")
      }

      details.filters = {
        ...details.filters,
        on_boarding_start,
        on_boarding_end
      }
    }

    if (!isEmptyField(user_ids) && user_ids.length > 0) {
      details.filters = {
        ...details.filters,
        user_ids,
      }
    }

    if (numOfFilters > 1) {
      throw new ClientError("Please pass one filter condition at a time")
    } else {
      if (numOfFilters == 1) {
        if (user_type != DIALOG_USER_TYPE.SPECIFIC_USER) {
          throw new ClientError("User Type should be of all user type when filter condition is applied")
        }
        if (user_ids && user_ids.length > 0) {
          throw new ClientError("User Ids is not required when filter condition is applied")
        }
      } else {
        if (isEmptyField(on_boarding_start) && isEmptyField(on_boarding_end)) {
          if ((!user_ids || user_ids.length < 1) && user_type == DIALOG_USER_TYPE.SPECIFIC_USER) {
            throw new ClientError("User Ids is required when campaign code or coupon code condition is not applied")
          }
        }
      }
    }

    if (Number(action_type) == DIALOG_ACTION_TYPE.RESTAURANT.action_key) {
      if (!res_id)
        throw new ClientError('Restaurant ID is required');
      let [restaurant] = await RestaurantsModel.findRestaurantById(res_id, null, dbTransaction);
      if (!restaurant) {
        throw new ClientError('Invalid Restaurant ID');
      }
      details.action_screen = DIALOG_ACTION_TYPE.RESTAURANT.action_key;
      details.action = `${DIALOG_ACTION_TYPE.RESTAURANT.value}&res_id=${restaurant.uid}`;
      details.res_id = restaurant.id;
    } else if (Number(action_type) == DIALOG_ACTION_TYPE.GAME.action_key) {
      const liveTournamentPromise = TournamentsModel.getLiveTournamentDetails(dbTransaction) || [];
      const completedTournamentPromise = TournamentsModel.getCompletedTournamentDetails(dbTransaction) || [];
      const [[liveTournament], [completedTournament]] = await Promise.all([liveTournamentPromise, completedTournamentPromise])
      if (!liveTournament && !completedTournament) {
        throw new ClientError('No active or completed tournament found');
      }
      let tournament = liveTournament || completedTournament;
      details.action_screen = DIALOG_ACTION_TYPE.GAME.action_key;
      details.action = `${DIALOG_ACTION_TYPE.GAME.value}&tournament_id=${tournament.uid}&game_id=${tournament.game_id}`;
      details.tournament_id = tournament.id;
    }

    const payload = {
      title,
      message,
      details,
    }

    delete payload?.details;
    delete payload?.res_id;
    delete payload?.coupon_id;
    delete payload?.is_coupon_used;
    delete payload?.campaign_id;
    delete payload?.button_name;
    delete payload?.on_boarding_start;
    delete payload?.on_boarding_end;

    if (Number(user_type) == Bit.zero) {
      let dialogUsers;
      if (!isEmptyField(coupon_id)) {
        const [coupon] = await CouponsModel.findOneByuId(coupon_id, dbTransaction);
        if (!coupon) {
          throw new ClientError("Coupon not found");
        }

        //checking if expiration time is valid
        if (Number(coupon.expiration_at) <= Math.floor(Date.now() / 1000)) {
          throw new ClientError("Coupon has been expired");
        }

        dialogUsers = await getCouponRedeemUser({ coupon_id: coupon.id, is_coupon_used, on_boarding_start: on_boarding_start, on_boarding_end: on_boarding_end, dbTransaction });

      } else if (!isEmptyField(campaign_id)) {
        const [campaign] = await CampaignModel.findOneByuId(campaign_id, dbTransaction);

        await validateCampaign(campaign);

        const [coupon] = await CouponsModel.findOneById(campaign.coupon_id, dbTransaction);
        if (!coupon) {
          throw new ClientError("Coupon not found");
        }

        //checking if expiration time is valid
        if (Number(coupon.expiration_at) <= Math.floor(Date.now() / 1000)) {
          throw new ClientError("Campaign coupon has been expired");
        }

        dialogUsers = await getCouponRedeemUser({ coupon_id: campaign.coupon_id, is_coupon_used, on_boarding_start: on_boarding_start, on_boarding_end: on_boarding_end, dbTransaction });

      } else if (!isEmptyField(on_boarding_start) || !isEmptyField(on_boarding_end)) {
        dialogUsers = await UsersModel.findUserWithOnBoardingDate(on_boarding_start, on_boarding_end, dbTransaction);
      } else {
        dialogUsers = await UsersModel.findUsersWithMultipleUid(user_ids, dbTransaction);
      }

      const userIds = dialogUsers.map(user => user.id);
      // console.log("userIds ******* ", userIds.length, userIds);
      if (userIds.length > 0) {
        //finding fcm_token of user
        const userFcmToken = await UsersModel.findFcmToken(userIds);
        const fcmTokens = userFcmToken.map(user => user.fcm_token);

        // console.log("fcmTokens ******* ", fcmTokens.length, fcmTokens);

        if (fcmTokens && fcmTokens.length > 0) {
          sendPushNotificationToDevice({ title: payload.title, message: payload.message, fcmToken: fcmTokens, type: NotificationImageType.WITHOUT_IMAGE, data: payload.details })
        }
      }
    } else {
      //send notification with topic
      throw new ClientError("As of now sending notification to all users is not supported")
      // let topic;
      // if (process.env.NODE_ENV != 'prod') {
      //   topic = process.env.DEV_TOPIC;
      // } else {
      //   topic = process.env.LIVE_TOPIC;
      // }
      // sendPushNotificationToTopic({ title: payload.title, message: payload.message, topic, data: payload.details })
    }

    return { msg: 'Notification sent successfully' }
  }

  static async update(data) {
    const { 
      id, 
      title, 
      message, 
      button_name = "Submit", 
      action, 
      action_type, 
      start_time, 
      end_time, 
      status = Bit.one, 
      res_id,
      deal_id,
      image, 
      is_close,
      user_type,
      user_ids, 
      campaign_id, 
      coupon_id, 
      is_coupon_used, 
      on_boarding_start, 
      on_boarding_end, 
      user_list, 
      type = DIALOG_TYPE.DIALOG,
      dbTransaction 
    } = data
    const [dialog] = await DialogModel.findOneByuId(id, dbTransaction);

    //checking if dialog exists
    if (!dialog) {
      throw new ClientError("Invalid dialog Id");
    }

    let payload = {}

    const details = {
      // ...dialog.details
    }

    if (!isEmptyField(title)) {
      // duplicacy check of title
      const [dialogTitleExist] = await DialogModel.findRunningDialogByColumn('title', title, dbTransaction)
      if (dialogTitleExist && dialogTitleExist.id != dialog.id) {
        throw new ClientError(DUPLICATE_DIALOG_TITLE)
      }
      payload.title = title
    }

    if (!isEmptyField(message)) {
      payload.message = message
    }

    if (!isEmptyField(start_time)) {
      if (isEmptyField(end_time) && (Number(dialog.end_time) < Number(start_time))) {
        throw new ClientError('end time cannot be less than start time');
      }
      payload.start_time = start_time
    }

    if (!isEmptyField(end_time)) {
      let endTime = Number(end_time)
      if (!isEmptyField(start_time) && (Number(start_time) > endTime)) {
        throw new ClientError('End time cannot be less than start time');
      } 
      else if (isEmptyField(start_time) && (Number(dialog.start_time) > endTime)) {
        throw new ClientError('End time cannot be less than start time');
      }
      payload.end_time = endTime
    }

    if (!isEmptyField(status)) {
      payload.status = status
    }

    if (!isEmptyField(image)) {
      const [getMediaId] = await MediaModel.getOneByuId(image);
      if (!getMediaId)
        throw new ClientError("image not found");
      payload.image_id = getMediaId.id
    }
    
    if (!isEmptyField(is_close)) {
      payload.is_image_close = Number(is_close)
    }

    if (!isEmptyField(button_name)) {
      details.button_name = button_name
    }

    if (!isEmptyField(action)) {
      details.action = action
    }

    if (!isEmptyField(action_type)) {
      details.action_type = Number(action_type);
      if (Number(action_type) == DIALOG_ACTION_TYPE.RESTAURANT.action_key) {
        if (!res_id)
          throw new ClientError('Restaurant ID is required');
        let [restaurant] = await RestaurantsModel.findRestaurantById(res_id, null, dbTransaction);
        if (!restaurant) {
          throw new ClientError('Invalid Restaurant ID');
        }
        details.action_screen = DIALOG_ACTION_TYPE.RESTAURANT.action_key;
        details.action = `${DIALOG_ACTION_TYPE.RESTAURANT.value}&res_id=${restaurant.uid}`;
        details.res_id = restaurant.id;
      } else if (Number(action_type) == DIALOG_ACTION_TYPE.GAME.action_key) {
        const liveTournamentPromise = TournamentsModel.getLiveTournamentDetails(dbTransaction) || [];
        const completedTournamentPromise = TournamentsModel.getCompletedTournamentDetails(dbTransaction) || [];
        const [[liveTournament], [completedTournament]] = await Promise.all([liveTournamentPromise, completedTournamentPromise])
        if (!liveTournament && !completedTournament) {
          throw new ClientError('No active or completed tournament found');
        }
        let tournament = liveTournament || completedTournament;
        details.action_screen = DIALOG_ACTION_TYPE.GAME.action_key;
        details.action = `${DIALOG_ACTION_TYPE.GAME.value}&tournament_id=${tournament.uid}&game_id=${tournament.game_id}`;
        details.tournament_id = tournament.id;
      } else if (Number(action_type) == DIALOG_ACTION_TYPE.DEAL.action_key) {
        if (!deal_id){
          details.action_screen = DIALOG_ACTION_TYPE.DEAL.action_key;
          details.action = ``;
        } else {
          let [deal] = await DealModel.getOneByuId(deal_id, null, dbTransaction);
          if (!deal) {
            throw new ClientError('Invalid Deal ID');
          }
          details.action_screen = DIALOG_ACTION_TYPE.DEAL.action_key;
          details.action = `${DIALOG_ACTION_TYPE.DEAL.value}&deal_id=${deal.uid}`;
          details.deal_id = deal.id;
        }
      }
    }

    if(Object.keys(details).length){
      payload.details = {...dialog.details, ...details};
    }

    const { rows } = await DialogModel.updateOneById(payload, dialog.id, dbTransaction)
    if (rows < 1) {
      throw new ServerError(MESSAGES.DIALOG.UPDATE_ERROR);
    }

    return { msg: MESSAGES.DIALOG.DIALOG_UPDATED }
  }

  static async delete(data) {
    let { id } = data;

    const [dialog] = await DialogModel.findOneByuId(id);

    //checking if dialog exists
    if (!dialog) {
      throw new ClientError("Invalid dialog Id");
    }
    const currentEpoch = getEpoch();

    //checking if campaign is running
    if (dialog.status == Status.one && dialog.start_date <= currentEpoch && dialog.end_date > currentEpoch) {
      throw new ClientError("dialog is active. Cannot delete now");
    }

    //soft deleting coupon
    const { rows } = await DialogModel.updateOneById(
      { deleted_at: "CURRENT_TIMESTAMP" },
      dialog?.id
    );
    if (rows != 1) {
      throw new GeneralError("Unable to delete dialog");
    }
    return {
      msg: "dialog deleted successfully",
    };
  }
}

async function validateCampaign(campaign) {
  if (!campaign) {
    throw new ServerError("No compaign found")
  }

  //check if campaign is running 
  const currentTime = Math.floor(Date.now() / 1000)
  if (campaign.start_date > currentTime) {
    throw new ServerError("campaign is not running");
  }

  //check if campaign has ended 
  if (campaign.end_date < currentTime) {
    throw new ServerError("campaign has ended");
  }

  //check if coupon is expired
  if (campaign.expiration_at < currentTime) {
    throw new ServerError("This coupon has expired");
  }

  //check if coupon_id is presend
  if (isEmptyField(campaign.coupon_id)) {
    throw new ServerError("This campaign is not linked to any coupon");
  }
}

async function getCouponRedeemUser({ coupon_id, is_coupon_used, on_boarding_start, on_boarding_end, dbTransaction }) {
  const users = await CouponRedeemModel.findCouponUser({ coupon_id, is_used: is_coupon_used, on_boarding_start, on_boarding_end, transaction: dbTransaction });
  return users;
}



module.exports = DialogService;

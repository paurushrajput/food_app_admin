const { BannerType } = require("../../constants/banner");
const BannerModel = require("../../models/mysql/banner.model");
const RestaurantsModel = require("../../models/mysql/restaurants.model");
const MediaModel = require("../../models/mysql/media.model");
const TournamentsModel = require("../../models/mysql/tournaments.model");

const { getData, setData } = require("../../dbConfig/redisConnect");
const { createEpochDate } = require("../../utils/date");
const { getUrlFromBucket } = require("../../utils/s3");
const { createBannerRedisData } = require("../../utils/banner");
const { Bit } = require("../../constants/database");
const ClientError = require("../../error/clientError");
const { checkMandatoryFields, isEmptyField, getTrimmedValue } = require("../../utils/common.js");
const { mandatoryFieldErrorCode } = require("../../constants/statusCode");

class BannerService {

  /**
   * create banner
   * @param {string} body -create banner body
   */
  static async createBanner(body) {
    const {
      banner_type,
      action,
      banner_url,
      app_type,
      banner_order,
      banner_size,
      action_type,
      campaign_id,
      message,
      user
    } = body;
    let imageId;
    [imageId] = await MediaModel.getOneByuId(banner_url);
    if (!imageId) {
      throw new ClientError("image not found")
    }
    // Create a new object with the extracted fields
    const bannerData = {
      banner_type,
      banner_order,
      action,
      banner_url: imageId?.id || null,
      app_type,
      banner_size,
      campaign_id,
      message,
      created_by: user,
      action_screen: '',
      action_type
    };

    if (action_type === '2') {
      // If 'actionType' is '2', set 'action' and 'actionScreen' based on the 'bannerConstant' configuration
      bannerData.action_screen = action;
      bannerData.action = bannerConstant.bannerAction[action]['value'];
    }

    const banner = await BannerModel.insert(bannerData);

    if (app_type === 'pro' && banner_size === 'small' && banner_type === 'all') {
      // Handle your logic for 'pro', 'small', and 'all' banners
      const keyForBanner = `banner_${bannerConstant.appFrom.ps}`;
      const findPrevBannerData = await getData(keyForBanner);
      if (findPrevBannerData) {
        findPrevBannerData.push(banner);
        await setData(keyForBanner, findPrevBannerData);
      } else {
        await setData(keyForBanner, [banner]);
      }
    }

    if (app_type === 'webapp' && banner_size === 'small' && banner_type === 'all') {
      // Handle your logic for 'webapp', 'small', and 'all' banners
      const keyForBanner = `banner_${bannerConstant.appFrom.webApp}`;
      const findPrevBannerData = await getData(keyForBanner);

      if (findPrevBannerData) {
        findPrevBannerData.push(banner);
        await setData(keyForBanner, findPrevBannerData);
      } else {
        await setData(keyForBanner, [banner]);
      }
    }

    return banner;

  }

  /**
   * uppdate banner 
   * @param {string} - update body
   */
  static async updateBanner(body) {
    const {
      banner_type,
      action,
      banner_url,
      app_type,
      banner_order,
      banner_size,
      action_type,
      campaign_id,
      message,
      user,
      banner_uid
    } = body;
    let imageId;
    [imageId] = await MediaModel.getOneByuId(banner_url);
    if (!imageId) {
      throw new ClientError("image not found")
    }
    const bannerData = {
      banner_type,
      banner_order,
      action,
      banner_url: imageId?.id || null,
      app_type,
      banner_size,
      campaign_id,
      message,
      created_by: user,
      action_screen: '',
      action_type
    };

    if (bannerData.action == null) {
      bannerData.action = ''
    }
    if (bannerData.action_type == '2') {
      console.log(bannerConstant.bannerAction[bannerData.action]['value']);
      bannerData.action_screen = bannerData.action
      bannerData.action = bannerConstant.bannerAction[bannerData.action]['value']
    } else {
      bannerData.action = bannerData.action
      bannerData.action_screen = ''
    }
    let banner;
    const bannerD = await BannerModel.getOneByuId(banner_uid);
    if (bannerD[0].banner_url != bannerData.banner_url || bannerD[0].action != bannerData.action) {
      bannerData.timestamp = createEpochDate(new Date());
      banner = await BannerModel.updateOneById(bannerData, bannerD[0].id);
    }
    if (bannerD[0].app_type) {
      await createBannerRedisData(bannerD[0].app_type)
    }
    if (banner) {
      return banner;
    } else {
      return "Banner URL Needs To Be Changed";
    }
  }

  static async getBannerList(body) {
    const {
      page = 1,
      page_size = 10,
      sort_by = 'created_at',
      is_paginated = true,
      order = 'desc',
      type, source, banner_size,
      from_date, to_date,
      keyword
    } = body;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const response = await BannerModel.getBannerList({ sort, from_date, to_date, offset, limit, is_paginated, type, sort_by, source, banner_size, keyword });
    //await replaceFilenamesWithUrls(response.rows);

    // Replace the "filename" property in the response with URLs
    //for (const row of response.rows) {
    //    row.filename = row.filename;
    //}
    /*return {
      count: response.count,
      rows: response.rows
    };*/
    return {
      count: response.count,
      rows: response.rows?.map(each => ({
        ...each,
        action_type: bannerConstant.bannerAction[each.action_type]?.title || 'Unknown',
        filename: getUrlFromBucket(each.filename)
      }))
    }

  }

  static async changeStatus(body) {
    const { banner_uid } = body;
    const getBanner = await BannerModel.getOneByuId(banner_uid);
    console.log(getBanner[0].id);
    const response = await BannerModel.updateOneById({ status: Bit.zero }, getBanner[0].id);
    return response;
  }

  /**
  * list banner
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
      size,
      user,
    } = body;

    // if(isEmptyField(sort_by)) sort_by = 'created_at';
    // if(isEmptyField(order)) order = 'desc';
    // if(isEmptyField(page)) page = 1;
    // if(isEmptyField(page_size)) page_size = 10;
    // if(getTrimmedValue(is_paginated) === "false") is_paginated = false;
    // else is_paginated = true;

    if (isEmptyField(sort_by)) sort_by = Pagination.defaultSortColumn;
    if (isEmptyField(order)) order = Pagination.defaultOrder;
    if (isEmptyField(page)) page = Pagination.defaultPage;
    if (isEmptyField(page_size)) page_size = Pagination.pageSize;
    if (getTrimmedValue(is_paginated) === "false") is_paginated = false;
    else is_paginated = true;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const response = await BannerModel.list({
      sort,
      limit,
      offset,
      keyword,
      is_paginated,
      from_date,
      to_date,
      id,
      type,
      size
    })

    response.rows = response?.rows?.map(el => ({ ...el, banner_url: getUrlFromBucket(el.banner_url) })) || []

    return {
      count: response?.count || 0,
      rows: response?.rows || []
    };
  }

  /**
   * add banner
   * @param {string} body - values.
   */
  static async add(body) {
    const {
      image_id,
      banner_type,
      screen_type,
      action,
      action_screen,
      res_id,
      banner_size,
      start_time,
      end_time,
      user
    } = body;

    const mandatoryFieldStatus = checkMandatoryFields({
      banner_type,
      banner_size
    });

    if (mandatoryFieldStatus.errorCode == mandatoryFieldErrorCode) {
      throw new ClientError(mandatoryFieldStatus.errorMessage);
    }

    let getMediaId
    if (!isEmptyField(image_id)) {
      [getMediaId] = await MediaModel.getOneByuId(image_id);

      if (!getMediaId)
        throw new ClientError("image not found in media");
    }

    if (!isEmptyField(end_time)) {
      if (Number(end_time) < createEpochDate())
        throw new ClientError(`End time cannot be less than current time`);
    }

    if (!isEmptyField(start_time)) {
      if (Number(end_time) < Number(start_time))
        throw new ClientError(`End time cannot be less than Start time`);
    }

    const bannerData = {
      banner_type,
      banner_size,
      action,
      action_screen,
      banner_url: getMediaId?.id || null,
      created_by: user,
      start_time: start_time || createEpochDate(),
      end_time
    };


    if (screen_type) {
      bannerData.screen_type = screen_type;
    }

    if (banner_type === BannerType.restaurant.key) {
      if (!res_id)
        throw new ClientError('Restaurant ID is required');
      let [restaurant] = await RestaurantsModel.findRestaurantById(res_id);
      if (!restaurant) {
        throw new ClientError('Invalid Restaurant ID');
      }
      bannerData.action_screen = BannerType.restaurant.key;
      bannerData.action = `${BannerType.restaurant.value}&res_id=${restaurant.uid}`;
      bannerData.res_id = restaurant.id;
    } else if (banner_type === BannerType.game.key) {
      const liveTournamentPromise = TournamentsModel.getLiveTournamentDetails() || [];
      const completedTournamentPromise = TournamentsModel.getCompletedTournamentDetails() || [];
      const [[liveTournament], [completedTournament]] = await Promise.all([liveTournamentPromise, completedTournamentPromise])
      if (!liveTournament && !completedTournament) {
        throw new ClientError('No active or completed tournament found');
      }
      let tournament = liveTournament || completedTournament;
      bannerData.action_screen = BannerType.game.key;
      bannerData.action = `${BannerType.game.value}&tournament_id=${tournament.uid}&game_id=${tournament.game_id}`;
      bannerData.tournament_id = tournament.id;
    }

    await BannerModel.insert(bannerData);
    return { msg: 'Banner Added' };
  }

  /**
  * update banner
  * @param {string} body -  values.
  */
  static async update(body) {
    let {
      image_id,
      banner_type,
      banner_size,
      action,
      action_screen,
      res_id,
      status,
      start_time,
      end_time,
      id,
      user,
      screen_type,
    } = body;

    const mandatoryFieldStatus = checkMandatoryFields({
      id
    });

    if (mandatoryFieldStatus.errorCode == mandatoryFieldErrorCode) {
      throw new ClientError(mandatoryFieldStatus.errorMessage);
    }

    const [banner] = await BannerModel.getOneByColumns({
      columns: ["uid"],
      values: [id],
    });

    if (!banner) throw new ClientError("Banner not found");

    const updateObj = { updated_by: user };

    if (screen_type) {
      updateObj.screen_type = screen_type;
    }

    let getMediaId
    if (!isEmptyField(image_id)) {
      [getMediaId] = await MediaModel.getOneByuId(image_id);

      if (!getMediaId)
        throw new ClientError("image not found in media");

      updateObj.banner_url = getMediaId?.id;
    }

    if (!isEmptyField(banner_type)) updateObj.banner_type = banner_type;
    if (!isEmptyField(banner_size)) updateObj.banner_size = banner_size;
    if (!isEmptyField(action)) updateObj.action = action;
    if (!isEmptyField(action_screen)) updateObj.action_screen = action_screen;
    if (!isEmptyField(status)) updateObj.status = status;
    if (!isEmptyField(start_time)) updateObj.start_time = start_time;
    if (!isEmptyField(end_time)) updateObj.end_time = end_time;

    if (!isEmptyField(banner_type) && !isEmptyField(res_id) && banner_type === BannerType.restaurant.key) {
      let [restaurant] = await RestaurantsModel.findRestaurantById(res_id);
      if (!restaurant) {
        throw new ClientError('Invalid restaurant_id');
      }
      updateObj.action_screen = BannerType.restaurant.key;
      updateObj.action = `${BannerType.restaurant.value}&res_id=${restaurant.uid}`;
      updateObj.res_id = restaurant.id;
    } else if (!isEmptyField(banner_type) && banner_type === BannerType.game.key) {
      const liveTournamentPromise = TournamentsModel.getLiveTournamentDetails() || [];
      const completedTournamentPromise = TournamentsModel.getCompletedTournamentDetails() || [];
      const [[liveTournament], [completedTournament]] = await Promise.all([liveTournamentPromise, completedTournamentPromise])
      if (!liveTournament && !completedTournament) {
        throw new ClientError('No active or completed tournament found');
      }
      let tournament = liveTournament || completedTournament;
      updateObj.action_screen = BannerType.game.key;
      updateObj.action = `${BannerType.game.value}&tournament_id=${tournament.uid}&game_id=${tournament.game_id}`;
      updateObj.tournament_id = tournament.id;
    }

    await BannerModel.updateOneById(updateObj, banner.id);

    return { msg: 'Banner Updated' };
  }

  /**
  * delete banner
  * @param {string} body - story id.
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

    const [banner] = await BannerModel.getOneByColumns({
      columns: ["uid"],
      values: [id],
    });

    if (!banner) throw new ClientError("Banner not found");

    const updateObj = {
      deleted_at: `now()`
    };

    await BannerModel.updateOneById(updateObj, banner.id);

    return { msg: 'Banner Deleted' };
  }

  static async updateStatus() {

    const {rows,count}  = await BannerModel.onlyExpiredBanners();

    const bannerIds = []
    rows?.map((item)=>{
      bannerIds.push(item.id)
    })
    let affectedRows ;
    if(bannerIds?.length > 0){
      affectedRows = await BannerModel.updateExpiredBanners(bannerIds)
    }

    return {
      count,
      affectedRows,
      rows
    };
  }
}
module.exports = BannerService;
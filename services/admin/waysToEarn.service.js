const { BannerType } = require("../../constants/banner");
const RestaurantsModel = require("../../models/mysql/restaurants.model");
const MediaModel = require("../../models/mysql/media.model");
const TournamentsModel = require("../../models/mysql/tournaments.model");
const { getUrlFromBucket } = require("../../utils/s3");
const ClientError = require("../../error/clientError");
const {
  isEmptyField,
  getTrimmedValue,
  isEmpty,
} = require("../../utils/common.js");
const {
  NUKHBA_COIN_UID_BETA,
  NUKHBA_COIN_UID_PROD,
} = require("../../constants/variables.js");
const WaysToEarnModel = require("../../models/mysql/waysToEarn.model.js");

class WaysToEarnService {
  /**
   * add banner
   * @param {string} body - values.
   */
  static async add(body) {
    let {
      title,
      type,
      action,
      res_id,
      coins,
      coin_currency = "NC",
      icon,
      button_name,
      status = 1,
    } = body;

    // icon
    const env = process.env.NODE_ENV;
    if (isEmpty(icon)) {
      if (env === "local") {
        icon = NUKHBA_COIN_UID_BETA;
      } else {
        icon = NUKHBA_COIN_UID_PROD;
      }
    }

    const [mediaRes] = await MediaModel.getOneByUId(icon);

    const payload = {
      title,
      type,
      action,
      coins,
      coin_currency,
      icon: mediaRes.id,
      button_name,
      status,
    };

    if (type === BannerType.restaurant.key) {
      if (!res_id) throw new ClientError("Restaurant ID is required");
      let [restaurant] = await RestaurantsModel.findRestaurantById(res_id);
      if (!restaurant) {
        throw new ClientError("Invalid Restaurant ID");
      }
      payload.action = `${BannerType.restaurant.value}&res_id=${restaurant.uid}`;
    } else if (type === BannerType.game.key) {
      const liveTournamentPromise =
        TournamentsModel.getLiveTournamentDetails() || [];
      const completedTournamentPromise =
        TournamentsModel.getCompletedTournamentDetails() || [];
      const [[liveTournament], [completedTournament]] = await Promise.all([
        liveTournamentPromise,
        completedTournamentPromise,
      ]);
      if (!liveTournament && !completedTournament) {
        throw new ClientError("No active or completed tournament found");
      }
      let tournament = liveTournament || completedTournament;
      payload.action = `${BannerType.game.value}&tournament_id=${tournament.uid}&game_id=${tournament.game_id}`;
    }

    const res = await WaysToEarnModel.insert(payload);

    return res;
  }

  static async list(body) {
    let {
      page = 1,
      page_size = 10,
      is_paginated = true,
      sort_by = "wte.sequence asc, wte.created_at",
      order = "desc",
    } = body;

    if (isEmptyField(sort_by)) sort_by = Pagination.defaultSortColumn;
    if (isEmptyField(order)) order = Pagination.defaultOrder;
    if (isEmptyField(page)) page = Pagination.defaultPage;
    if (isEmptyField(page_size)) page_size = Pagination.pageSize;
    if (getTrimmedValue(is_paginated) === "false") is_paginated = false;
    else is_paginated = true;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const response = await WaysToEarnModel.list({
      sort,
      limit,
      offset,
      is_paginated,
    });

    response.rows =
      response?.rows?.map((el) => ({
        ...el,
        icon: getUrlFromBucket(el.icon),
      })) || [];

    return {
      count: response?.count || 0,
      rows: response?.rows || [],
    };
  }

  static async update(body) {
    let {
      id,
      title,
      type,
      action,
      res_id,
      coins,
      coin_currency,
      icon,
      button_name,
      status,
    } = body;

    const [wayRes] = await WaysToEarnModel.getOneByuId(id)
    if(isEmpty(wayRes)){
      throw new ClientError('No way to earn exist with this id')
    }

    const payload = {};

    if(!isEmpty(title)){
      payload.title = title
    }

    if(!isEmpty(action)){
      payload.action = action
    }

    if(!isEmpty(icon)){
      const [mediaRes] = await MediaModel.getOneByUId(icon);
      payload.icon = mediaRes.id
    }

    if(!isEmpty(type)){
      payload.type = type
    }

    if(!isEmpty(coins)){
      payload.coins = coins
    }

    if(!isEmpty(coin_currency)){
      payload.coin_currency = coin_currency
    }

    if(!isEmpty(status)){
      payload.status = status
    }

    if(!isEmpty(button_name)){
      payload.button_name = button_name
    }

    

    if (type === BannerType.restaurant.key) {
      if (!res_id) throw new ClientError("Restaurant ID is required");
      let [restaurant] = await RestaurantsModel.findRestaurantById(res_id);
      if (!restaurant) {
        throw new ClientError("Invalid Restaurant ID");
      }
      payload.action = `${BannerType.restaurant.value}&res_id=${restaurant.uid}`;
    } else if (type === BannerType.game.key) {
      const liveTournamentPromise =
        TournamentsModel.getLiveTournamentDetails() || [];
      const completedTournamentPromise =
        TournamentsModel.getCompletedTournamentDetails() || [];
      const [[liveTournament], [completedTournament]] = await Promise.all([
        liveTournamentPromise,
        completedTournamentPromise,
      ]);
      if (!liveTournament && !completedTournament) {
        throw new ClientError("No active or completed tournament found");
      }
      let tournament = liveTournament || completedTournament;
      payload.action = `${BannerType.game.value}&tournament_id=${tournament.uid}&game_id=${tournament.game_id}`;
    }

    const res = await WaysToEarnModel.updateOneById(payload,wayRes.id);

    return {
      msg: `Updated successfully`,
    };
  }

  static async updateWaysSequence(body) {
    const { data, dbTransaction } = body;

    for (let item of data) {
      const [existingWay] = await WaysToEarnModel.getOneByuId(item.id, dbTransaction);
      if (!existingWay) throw new ClientError("Invalid way to earn")
      const { rows } = await WaysToEarnModel.updateOneById({ sequence: item.sequence }, existingWay.id, dbTransaction);
      if (rows < 1) {
        throw new ServerError("Unable to update sequence")
      }
    }

    return {
      msg: 'Ways to earn Sequence updated'
    }
  }

}
module.exports = WaysToEarnService;

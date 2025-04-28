const TournamentsModel = require("../../models/mysql/tournaments.model");
const WinnerBreakupModel = require("../../models/mysql/winnerBreakup.model.js");
const TournamentRulesModel = require("../../models/mysql/tournamentRules.model.js");
const MediaModel = require("../../models/mysql/media.model");
const ClientError = require("../../error/clientError");
const { checkMandatoryFields, isEmptyField, getTrimmedValue, getKeyByValue, isEmpty } = require("../../utils/common.js");
const { mandatoryFieldErrorCode } = require("../../constants/statusCode");
const { TournamentStatus, TournamentRewardType, TournamentEntryType, TournamentType, USER_REFERRAL_POINTS } = require("../../constants/tournaments.js");
const { getUrlFromBucket } = require("../../utils/s3");
const { createEpochDate } = require("../../utils/date.js");
const { post } = require("../../utils/fetch");
const { GameUrls } = require("../../constants/games");
const { Pagination, Status } = require("../../constants/database");

class TournamentsService {
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
      user,
      status,
    } = body;


    // if (isEmptyField(sort_by)) sort_by = 'created_at';
    // if (isEmptyField(order)) order = 'desc';
    // if (isEmptyField(page)) page = 1;
    // if (isEmptyField(page_size)) page_size = 10;
    // if (getTrimmedValue(is_paginated) === "false") is_paginated = false;
    // else is_paginated = true;

    if(isEmptyField(sort_by)) sort_by = Pagination.defaultSortColumn;
    if(isEmptyField(order)) order = Pagination.defaultOrder;
    if(isEmptyField(page)) page = Pagination.defaultPage;
    if(isEmptyField(page_size)) page_size = Pagination.pageSize;
    if(getTrimmedValue(is_paginated) === "false") is_paginated = false;
    else is_paginated = true;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const response = await TournamentsModel.list({
      sort,
      limit,
      offset,
      keyword,
      is_paginated,
      from_date,
      to_date,
      id,
      status
    })

    response.rows = response?.rows?.map(el => ({ ...el, image: getUrlFromBucket(el.image) })) || []

    return {
      count: response?.count || 0,
      rows: response?.rows?.map(row => ({
        ...row,
        status: getKeyByValue(TournamentStatus, row.status)
      })) || []
    };
  }

  /**
  * add torunament
  * @param {string} body - name, email values.
  */
  static async add(body) {
    let {
      game_id,
      game_url,
      game_name,
      title,
      image_id,
      date_start,
      date_end,
      reward_type,
      winner_breakup_id,
      tournament_rule_id,
      min_user,
      max_user,
      entry_fee,
      total_winning_amount,
      entry_type,
      type = TournamentType.referral,
      user_referral_points,
      user,
      image_on_redeem_page
    } = body;

    const mandatoryFieldStatus = checkMandatoryFields({
      game_id,
      game_name,
      game_url,
      title,
      date_start,
      date_end,
      // type,
      winner_breakup_id,
      tournament_rule_id
    });

    if (mandatoryFieldStatus.errorCode == mandatoryFieldErrorCode) {
      throw new ClientError(mandatoryFieldStatus.errorMessage);
    }

    const [existingWinnerBreakUp] = await WinnerBreakupModel.findOneByuId(winner_breakup_id);
    if (!existingWinnerBreakUp)
      throw new ClientError("winner breakup not found");
    const [tournamentRule] = await TournamentRulesModel.findOneByuId(tournament_rule_id);
    if (!tournamentRule)
      throw new ClientError("tournament rule not found");

    const [tournament] = await TournamentsModel.isTournamentExist({
      columns: ["game_id", "type"],
      values: [game_id, type],
    });

    if (tournament)
      throw new ClientError("Tournament For This Game and Type Already Added");

    const [liveTournaments] = await TournamentsModel.getLiveTournaments({game_id:game_id})

    if(liveTournaments?.count > 0){
      throw new ClientError("Tournament For This Game is already running. please try again later");
    }

    let getMediaId
    if (!isEmptyField(image_id)) {
      [getMediaId] = await MediaModel.getOneByuId(image_id);

      if (!getMediaId)
        throw new ClientError("image not found in media");
    }

    let getRedeemImageUrl
    if (!isEmpty(image_on_redeem_page)) {
      const [getRedeemImageRes] = await MediaModel.getImageByUid(image_on_redeem_page);
      
      if (!getRedeemImageRes?.id)
        throw new ClientError("image not found in media");

      getRedeemImageUrl = getUrlFromBucket(getRedeemImageRes?.icon) 
     
    }
    

    const insertObj = {
      game_id,
      title,
      image: getMediaId?.id || null,
      date_start,
      date_end,
      reward_type: reward_type || TournamentRewardType.points,
      winner_breakup_id: existingWinnerBreakUp.id,
      tournament_rule_id: tournamentRule.id,
      min_user: min_user || 1,
      max_user: max_user || -1,
      entry_fee: entry_fee || 0,
      total_winning_amount: total_winning_amount || null,
      entry_type: entry_type || TournamentEntryType.free,
      type: type || TournamentType.referral,
      user_referral_points: user_referral_points || USER_REFERRAL_POINTS,
      other_details: { game_url, game_name },
      created_by: user
    };

    if(!isEmpty(getRedeemImageUrl)){
      insertObj.other_details.image_on_redeem_page = getRedeemImageUrl
    }

    await TournamentsModel.insert(insertObj);

    return { msg: 'Tournament Added' };
  }

  /**
  * update tournament
  * @param {string} body - name, email values.
  */
  static async update(body) {
    let {
      title,
      image_id,
      date_start,
      date_end,
      reward_type,
      winner_breakup_id,
      tournament_rule_id,
      min_user,
      max_user,
      entry_fee,
      total_winning_amount,
      entry_type,
      type,
      user_referral_points,
      status,
      game_name,
      id,
      user,
      image_on_redeem_page
    } = body;

    const mandatoryFieldStatus = checkMandatoryFields({
      id
    });

    if (mandatoryFieldStatus.errorCode == mandatoryFieldErrorCode) {
      throw new ClientError(mandatoryFieldStatus.errorMessage);
    }

    const [tournament] = await TournamentsModel.getOneByColumns({
      columns: ["uid"],
      values: [id],
    });

    if (!tournament) throw new ClientError("Tournament not found");

    const updateObj = {};

    let getMediaId
    if (!isEmptyField(image_id)) {
      [getMediaId] = await MediaModel.getOneByuId(image_id);

      if (!getMediaId)
        throw new ClientError("image not found in media");

      updateObj.image = getMediaId?.id;
    }

    if (!isEmptyField(title)) updateObj.title = title;
    if (!isEmptyField(date_start)) updateObj.date_start = date_start;
    if (!isEmptyField(date_end)) updateObj.date_end = date_end;
    if (!isEmptyField(reward_type)) updateObj.reward_type = reward_type;
    if (!isEmptyField(winner_breakup_id)) {
      const [existingWinnerBreakUp] = await WinnerBreakupModel.findOneByuId(winner_breakup_id);
      if (!existingWinnerBreakUp)
        throw new ClientError("winner breakup not found");
      updateObj.winner_breakup_id = existingWinnerBreakUp.id;
    }
    if (!isEmptyField(tournament_rule_id)) {
      const [tournamentRule] = await TournamentRulesModel.findOneByuId(tournament_rule_id);
      if (!tournamentRule)
        throw new ClientError("tournament rule not found");
      updateObj.tournament_rule_id = tournamentRule.id;
    }
    if (!isEmptyField(min_user)) updateObj.min_user = min_user;
    if (!isEmptyField(max_user)) updateObj.max_user = max_user;
    if (!isEmptyField(entry_fee)) updateObj.entry_fee = entry_fee;
    if (!isEmptyField(total_winning_amount)) updateObj.total_winning_amount = total_winning_amount;
    if (!isEmptyField(entry_type)) updateObj.entry_type = entry_type;
    if (!isEmptyField(type)) updateObj.type = type;
    if (!isEmptyField(user_referral_points)) updateObj.user_referral_points = user_referral_points;
    if (!isEmptyField(status)) updateObj.status = status;
    if (!isEmptyField(game_name)) updateObj.other_details = { ...tournament.other_details, game_name};


    let getRedeemImageUrl
    if (!isEmpty(image_on_redeem_page)) {
      const [getRedeemImageRes] = await MediaModel.getImageByUid(image_on_redeem_page);
      
      if (!getRedeemImageRes?.id)
        throw new ClientError("image not found in media");
      
      getRedeemImageUrl = getUrlFromBucket(getRedeemImageRes?.icon) 

      

      if(!isEmpty(updateObj?.other_details)){
        updateObj.other_details.image_on_redeem_page = getRedeemImageUrl ;
      }else{
        updateObj.other_details = { ...tournament.other_details,image_on_redeem_page: getRedeemImageUrl};
      }
    }


    await TournamentsModel.updateOneById(updateObj, tournament.id);

    return { msg: 'Tournament Updated' };
  }

  /**
  * delete tournament
  * @param {string} body - client_id values.
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

    const [tournament] = await TournamentsModel.getOneByColumns({
      columns: ["uid"],
      values: [id],
    });

    if (!tournament) throw new ClientError("Tournament not found");

    const updateObj = {
      deleted_at: `now()`
    };

    await TournamentsModel.updateOneById(updateObj, tournament.id);

    return { msg: 'Tournament Deleted' };
  }

  /**
 * update tournament status
 * @param {string} body - values.
 */
  static async updateTournamentStatus(body) {

    //updating the status of scheduled tournament to live
    const tournamentScheduled = await TournamentsModel.getScheduledTournaments() || [];
    for (let tournament of tournamentScheduled) {
      if (tournament.date_start <= createEpochDate()) {
        await TournamentsModel.updateOneById({ status: TournamentStatus.live }, tournament.id);
      }
    }


    /**--------------------------------------------------------------------------------------------------- */


    //updating the status of live tournament to completed
    const tournaments = await TournamentsModel.getActiveTournaments() || [];

    for (let tournament of tournaments) {
      if (tournament.date_end <= createEpochDate()) {
        await TournamentsModel.updateOneById({ status: TournamentStatus.completed }, tournament.id);
      }
    }
    return { msg: 'Tournament Status Updated' };
  }

  static async getGameList(data) {
    let { user, client_token } = data;

    const body = {}
    const headers = { "x-api-key": process.env.CLIENT_ID }
    if (!isEmptyField(client_token)) headers['client_token'] = client_token;
    else body['client_password'] = process.env.CLIENT_PASSWORD;

    const result = await post({ url: GameUrls.GET_CLIENT_GAMES_LIST, body: body, headers: { customHeaders: headers } });
    return result?.data?.data?.games || []
  }

}

module.exports = TournamentsService;
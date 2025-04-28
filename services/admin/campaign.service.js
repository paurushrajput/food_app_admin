const ClientError = require("../../error/clientError");
const ServerError = require("../../error/serverError");
const CouponsModel = require("../../models/mysql/coupons.model");
const UsersModel = require("../../models/mysql/users.model");
const { isEmptyField, getTrimmedValue } = require("../../utils/common");
const {
  CAMPAIGN_ACTION,
  CouponType,
  USER_TYPE,
  CAMPAIGN_COMMISSION_TYPE,
  Status,
  Pagination
} = require("../../constants/database");
const CampaignModel = require("../../models/mysql/campaign.model");
const { getKeyByValue } = require("../../utils/general");
const { getEpoch } = require("../../utils/moment");

class CampaignService {
  
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
      is_expired
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

    const response = await CampaignModel.list({
      sort,
      limit,
      offset,
      is_paginated,
      keyword,
      from_date,
      to_date,
      id,
      status,
      is_expired
    });

    return {
      count: response.count,
      rows: response.rows?.map((each) => ({
        ...each,
        commission_type: {
          key: getKeyByValue(CAMPAIGN_COMMISSION_TYPE, each.commission_type),
          value: each.commission_type,
        },
        action: {
          key: getKeyByValue(CAMPAIGN_ACTION, each.action),
          value: each.action,
        },
        username: each?.agent_name
      })),
    };
  }

  /**
   * add campaign
   * @param {string} body - name, email values.
   */
  static async add(data) {
    let {
      title,								//mandatory
      start_date,						//mandatory
      end_date,							//mandatory
      commission_type,
      commission_amount,
      agent_id,
      coupon_id,
      action,
    } = data;

		start_date = Number(start_date);
		end_date = Number(end_date);
		const currentEpoch = getEpoch();

    if(isEmptyField(commission_type)) commission_type = CAMPAIGN_COMMISSION_TYPE.FLAT;

    const insertObj = {
      title,
      start_date,
      end_date,
      commission_type,
      commission_amount,
      action,
    };

    if(isEmptyField(agent_id)){
      if (!isEmptyField(action)){
        throw new ClientError("Cannot set action for non agent campaign");
      }
      insertObj.commission_type = null;
      insertObj.commission_amount = null;
    } else {
      if (isEmptyField(action)){
        action = CAMPAIGN_ACTION.CPR
      }
      if (isEmptyField(commission_amount)){
        throw new ClientError("Commission amount is required");
      }
    }


    // if (!isEmptyField(agent_id) && !isEmptyField(coupon_id)) {
    //   throw new ClientError("Campaign cannot have both Agent Id and Coupon Id");
    // }
		if (isEmptyField(agent_id) && isEmptyField(coupon_id)) {
      throw new ClientError("Coupon Id or Agent Id is required");
    }

    const [campaign] = await CampaignModel.checkCampaignExistWithSameTitle({title})
    if(campaign)
      throw new ClientError("Campaign exist with same title");

    //agent id check
    if (!isEmptyField(agent_id)) {
      const [user] = await UsersModel.findUserWithUid(agent_id);
      if (!user || user.user_type != USER_TYPE.AGENT) {
        throw new ClientError("Invalid Agent ID");
      }

      //coupon id check
      if (isEmptyField(coupon_id))
        throw new ClientError("Coupon Id is required");

			const [couponRes] = await CouponsModel.findOneByuId(coupon_id);

			if (!couponRes || Number(couponRes.type) !== CouponType.agent) {
				throw new ClientError("Invalid Coupon Id");
			}

      const [campaign] = await CampaignModel.findRunningCampaignByAgent(user.id, action)
      if(campaign)
        throw new ClientError("Active Campaign Exist");

      insertObj.agent_id = user.id;
      insertObj.coupon_id = couponRes.id;
    } else if (!isEmptyField(coupon_id)) {
		  //coupon id check
			const [couponRes] = await CouponsModel.findOneByuId(coupon_id);

			if (!couponRes || Number(couponRes.type) !== CouponType.campaign) {
				throw new ClientError("Invalid Coupon Id");
			}
      const [campaign] = await CampaignModel.findRunningCouponCampaign({couponId: couponRes.id})
      if(campaign)
        throw new ClientError("Active Campaign Exist");

      insertObj.coupon_id = couponRes.id;
    }

		//start and end date check
		if (start_date < currentEpoch) {
      throw new ClientError("Start date cannot be less than current date time");
    }

    if (end_date <= start_date) {
      throw new ClientError("End date cannot be less than or equal to start date");
    }

    const { rows } = await CampaignModel.insert(insertObj);

    if (rows < 1) {
      throw new ServerError("Unable to add campaign");
    }

    return {
      msg: "Campaign added successfully",
    };
  }

  /**
   * update campaign
   * @param {string} body - name, email values.
   */
  static async update(data) {
    const {
      id,
      title,
      start_date,
      end_date,
      commission_type,
      commission_amount,
      agent_id,
      coupon_id,
      action,
    } = data;

		const currentEpoch = getEpoch();

    const [campaign] = await CampaignModel.findOneByuId(id);

    //checking if coupons exists
    if (!campaign) {
      throw new ClientError("Invalid Campaign Id");
    }

    //checking if campaign is running
    if (campaign.status == Status.one && campaign.start_date <= currentEpoch && campaign.end_date > currentEpoch) {
      // throw new ClientError("Campaign in running. Cannot update now");
    }

    const updateObj = {};

    if (!isEmptyField(title)) updateObj.title = title;
    if (!isEmptyField(commission_type)) updateObj.commission_type = commission_type;
    if (!isEmptyField(commission_amount)) updateObj.commission_amount = commission_amount;
    // if (!isEmptyField(action)) updateObj.action = action;

    if (!isEmptyField(action)){
      if(isEmptyField(agent_id) && isEmptyField(campaign.agent_id))
        throw new ClientError("Cannot set action for non agent campaign");
      else 
        updateObj.action = action;
    }

    if (!isEmptyField(start_date)) updateObj.start_date = start_date;
    if (!isEmptyField(end_date)) updateObj.end_date = end_date;

    //start and end date check
		if (!isEmptyField(start_date) && !isEmptyField(end_date)) {
      //start and end date check
      // if (start_date < currentEpoch) {
      //   throw new ClientError("Start date cannot be less than current date time");
      // }

      if (end_date <= start_date) {
        throw new ClientError("End date cannot be less than or equal to start date");
      }
    } else if(!isEmptyField(start_date) && isEmptyField(end_date)){
      //start and end date check
      if (start_date < currentEpoch) {
        throw new ClientError("Start date cannot be less than current date time");
      }

      if (campaign.end_date <= start_date) {
        throw new ClientError("End date cannot be less than or equal to start date");
      }
    } else if(isEmptyField(start_date) && !isEmptyField(end_date)){
      //start and end date check
      if (end_date <= campaign.start_date) {
        throw new ClientError("End date cannot be less than or equal to start date");
      }
    }

    //agent id check
    if (!isEmptyField(agent_id)) {
      const [user] = await UsersModel.findUserWithUid(agent_id);
      if (!user || user.user_type != USER_TYPE.AGENT) {
        throw new ClientError("Invalid Agent ID");
      }

      //coupon id check
      // if (isEmptyField(coupon_id) && isEmptyField(campaign.coupon_id))
      //   throw new ClientError("Coupon Id is required");

      if (!isEmptyField(coupon_id)){
        const [couponRes] = await CouponsModel.findOneByuId(coupon_id);
        if (!couponRes || Number(couponRes.type) !== CouponType.agent) {
          throw new ClientError("Invalid Coupon Id");
        }
        updateObj.coupon_id = couponRes.id;
      } else if(!isEmptyField(campaign.coupon_id)){
        const [couponRes] = await CouponsModel.findOneById(campaign.coupon_id);
        if (!couponRes || Number(couponRes.type) !== CouponType.agent) {
          throw new ClientError("Invalid Coupon Id");
        }
        updateObj.coupon_id = couponRes.id;
      }
      
      // const [activeCampaign] = await CampaignModel.findRunningCampaignByColumn({column: "agent_id", value: user.id})
      // const [activeCampaign] = await CampaignModel.findRunningCampaignByAgent(user.id, (!isEmptyField(updateObj.action) ? updateObj.action : campaign.action))
      // if(activeCampaign)
        // throw new ClientError("Active Campaign Exist");

      updateObj.agent_id = user.id;
    } else if (!isEmptyField(coupon_id) && isEmptyField(agent_id) && !isEmptyField(campaign.agent_id)) {
		  //coupon id check
			const [couponRes] = await CouponsModel.findOneByuId(coupon_id);

			if (!couponRes || Number(couponRes.type) !== CouponType.agent) {
				throw new ClientError("Invalid Coupon Id");
			}

      updateObj.coupon_id = couponRes.id;
    } else if (!isEmptyField(coupon_id) && isEmptyField(agent_id) && isEmptyField(campaign.agent_id)) {
		  //coupon id check
			const [couponRes] = await CouponsModel.findOneByuId(coupon_id);

			if (!couponRes || Number(couponRes.type) !== CouponType.campaign) {
				throw new ClientError("Invalid Coupon Id");
			}
      const [activeCampaign] = await CampaignModel.findRunningCouponCampaign({couponId: couponRes.id})
      // if(activeCampaign)
      //   throw new ClientError("Active Campaign Exist");

      updateObj.coupon_id = couponRes.id;
    }

    if(isEmptyField(agent_id) && !isEmptyField(updateObj.action) && !isEmptyField(campaign.agent_id)){
      const [activeCampaign] = await CampaignModel.findRunningCampaignByAgent(campaign.agent_id, updateObj.action)
      // if(activeCampaign)
      //   throw new ClientError("Active Campaign Exist");
    }

    if (Object.keys(updateObj).length < 1) {
      throw new ClientError("No data to update");
    }

    const { rows } = await CampaignModel.updateOneById(
      updateObj,
      campaign.id
    );

    if (rows < 1) {
      throw new ServerError("Unable to update campaign");
    }

    return {
      msg: "Campaign updated successfully",
    };
  }

  /**
   * delete campaign
   * @param {string} body - campaign id.
   */
  static async delete(data) {
    let { id } = data;
		const currentEpoch = getEpoch();

    const [campaign] = await CampaignModel.findOneByuId(id);

    //checking if coupons exists
    if (!campaign) {
      throw new ClientError("Invalid Campaign Id");
    }

    //checking if campaign is running
    if (campaign.status == Status.one && campaign.start_date <= currentEpoch && campaign.end_date > currentEpoch) {
      throw new ClientError("Campaign in running. Cannot delete now");
    }

    //soft deleting coupon
    const { rows } = await CampaignModel.updateOneById(
      { deleted_at: "CURRENT_TIMESTAMP" },
      campaign?.id
    );
    if (rows != 1) {
      throw new GeneralError("Unable to delete campaign");
    }
    return {
      msg: "Campaign deleted successfully",
    };
  }
}

module.exports = CampaignService;

require("dotenv").config();
const UsersModel = require("../../models/mysql/users.model.js");
const UserTicketsModel = require("../../models/mysql/userTickets.model.js");
const NotificationService = require("./notification.service.js");
const MediaModel = require("../../models/mysql/media.model.js");
const CampaignModel = require("../../models/mysql/campaign.model.js");
const CouponModel = require("../../models/mysql/coupons.model.js");
const ClientError = require("../../error/clientError.js");
const ServerError = require("../../error/serverError.js");
const {
  UserStatus,
  Logins,
  UserTicketsType,
  Bit,
  Pagination,
} = require("../../constants/database.js");
const { getKeyByValue } = require("../../utils/general.js");
const { post } = require("../../utils/fetch.js");
const { updateVariablesInToken } = require("../../utils/userToken.js");
const { isEmptyField, getTrimmedValue } = require("../../utils/common.js");
const { getUrlFromBucket } = require("../../utils/s3.js");
const ReferralCodes = require("../../utils/referralcodes.js");
const AgentModel = require("../../models/mysql/agent.model.js");
const { hashPass } = require("../../utils/bcrypt.js");
const LocationModel = require("../../models/mysql/location.model.js");
const { getDynamicShareLink } = require("../../utils/firebase.js");
const referralCodesObject = new ReferralCodes();

class AgentService {
  static async addAgent(data) {
    let {
      email,
      country_code,
      mobile,
      agent_username,
      password,
      first_name,
      last_name,
      location_id,
      device_id,
      referral_code
    } = data;

    if (!isEmptyField(email)) {
      let [user] = await AgentModel.findIdWithEmail(email);

      if (user) {
        throw new ClientError("Email already found.");
      }
      email = email.trim();
      email = email.toString().toLowerCase();
    }

    let [user2] = await AgentModel.findIdWithAgentUsername(agent_username);

    if (user2) {
      throw new ClientError("Agent username already exist.");
    }

    //fetch location
    const [location] = await LocationModel.getOneByuId(location_id);

    if (!location) {
      throw new ClientError("Location not found.");
    }

    let hashedPass = await hashPass(password);
    
    let userRef;
    let referralCode;

    if(referral_code){
      userRef = await UsersModel.isReferralCodeExists(referral_code);
      if(userRef[0].count > 0){
        throw new ClientError(referral_code +" refferal_code already exist.")
      }
      referralCode = referral_code
    }else{
      do {
        referralCode = referralCodesObject.generateReferralCodeByName(
          first_name || last_name
        );
        userRef = await UsersModel.isReferralCodeExists(referralCode);
      } while (userRef[0].count > 0);
    }

    const firebaseResult = await getDynamicShareLink(referralCode);

    const payload = {
      agent_username,
      password: hashedPass,
      first_name,
      last_name,
      is_guest: 0,
      is_nukhba_user: 0,
      is_pilot: 0,
      user_type: 1,
      device_type: "web",
      location_id: location.id,
      referral_code: referralCode,
      device_id,
      share_link: firebaseResult.shortLink,
    };

    if (!isEmptyField(email)) {
      payload.email = email;
    }

    if (!isEmptyField(mobile) && !isEmptyField(country_code)) {
      payload.country_code = country_code;
      payload.mobile = mobile;
    }

    const { rows } = await AgentModel.insert(payload);
    if (rows != 1) {
      throw new ServerError("Something went wrong adding agen.");
    }
    return {
      msg: `Agent created successfully`,
    };
  }

  static async listAgents(data) {
    const {
      page = 1,
      page_size = 10,
      sort_by = "created_at",
      is_paginated = true,
      user_type = Bit.one,
      order = "desc",
      status = "",
      search = "",
      is_pilot,
      from_date,
      to_date,
      booking_count,
      is_nukhba_user,
      campaign_title,
      user_invites_status,
      country_code,
    } = data;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const {list,count} = await AgentModel.getAgentsList({
      sort,
      offset,
      limit,
      user_type,
      is_paginated,
      search,
      is_pilot,
      from_date,
      to_date,
      booking_count,
      is_nukhba_user,
      campaign_title,
      user_invites_status,
      country_code,
    });



    list.map((item)=>{
      item.compaign_start_date = item.compaign_start_date || ''
      item.compaign_end_date = item.compaign_end_date || '' 
      item.referral_code = item.referral_code || '' 
      item.location_name = item.location_name || '' 
      item.last_name = item.last_name || '' 
      item.first_name = item.first_name || '' 
      item.user_email = item.email || '' 
      item.mobile = item.mobile || '' 
      item.country_code = item.country_code || '' 
      item.commission_amount = item.commission_amount || '',
      item.share_link = item.share_link || '' ,
      item.earned_commission_amount = item.earned_commission_amount || ''

    })

    return {
      count: count[0].count,
      list: list,
    };
  }

}

module.exports = AgentService;

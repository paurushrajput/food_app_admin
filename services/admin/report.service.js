const { getKeyByValue, isEmptyField, isEmailValid } = require("../../utils/common.js");
const ClientError = require("../../error/clientError.js");
const CampaignModel = require("../../models/mysql/campaign.model.js");
const { dateToMillis } = require("../../utils/moment.js");
const { CAMPAIGN_COMMISSION_TYPE } = require("../../constants/database.js");

class ReportService {

    static async getCampaignReport(data) {
        let { campaign_code, start_date, end_date, user } = data;

        if (isEmptyField(start_date)) {
            start_date = null
        } 

        if (!isEmptyField(end_date)) {
            if (!isEmptyField(start_date) && start_date > end_date) {
                throw new ClientError("start_date cannot be greater than end_date")
            }
        } else {
            end_date = null
        }

        const result = await CampaignModel.getCampaignData(campaign_code, start_date, end_date);
        return result && result.map(elem => ({
            ...elem,
            commission_type: getKeyByValue(CAMPAIGN_COMMISSION_TYPE, Number(elem.commission_type)),
            type: isEmptyField(elem?.agent_id) ? 'Campaign' : 'Agent',
        })) || {
            msg: 'No data found'
        };
    }

    static async getAgentReport(data) {
        let { referral_code, user } = data;

        const result = await CampaignModel.findAgentCampaignReport(referral_code);
        return result;
    }
}


module.exports = ReportService;
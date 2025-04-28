require("dotenv").config();
const UsersModel = require("../../models/mysql/users.model");
const UserTicketsModel = require("../../models/mysql/userTickets.model");
const NotificationService = require("../../services/admin/notification.service");
const MediaModel = require("../../models/mysql/media.model");
const CampaignModel = require("../../models/mysql/campaign.model.js");
const CouponModel = require("../../models/mysql/coupons.model.js");
const UserInviteModel = require("../../models/mysql/invites.model.js");
const ClientError = require("../../error/clientError");
const ServerError = require("../../error/serverError");
const { UserStatus, Logins, UserTicketsType, Bit, Pagination, USER_TYPE, InfluencerApprovalStatus, COMMISSION_TYPE } = require("../../constants/database");
const { getKeyByValue } = require("../../utils/general");
const { post } = require("../../utils/fetch");
const { updateVariablesInToken } = require("../../utils/userToken");
const { isEmptyField, getTrimmedValue, isEmailValid } = require("../../utils/common");
const { getUrlFromBucket } = require("../../utils/s3");
const ReferralCodes = require("../../utils/referralcodes.js");
const AdminAuthModel = require("../../models/mysql/admin.model.js");
const InfluencersModel = require("../../models/mysql/influencers.model.js");
const referralCodesObject = new ReferralCodes();

class InfluencerService {

    static async getInfluencers(data) {
        let {
            page = 1,
            page_size = 10,
            sort_by = 'created_at',
            is_paginated = true,
            user_type,
            order = 'desc',
            search = null,
            status,
            is_pilot,
            from_date,
            to_date,
            booking_count,
            is_nukhba_user,
            campaign_title,
            user_invites_status,
            country_code,
            referred_by,
            device_id,
            total_signedup_user,
            total_verified_user,
            allow_referral,
            allow_campaign
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

        const response = await InfluencersModel.getInfluencersList({
            sort,
            offset,
            limit,
            user_type,
            is_paginated,
            search,
            status,
            is_pilot: !isEmptyField(is_pilot) ? Number(is_pilot) : null,
            from_date,
            to_date,
            booking_count,
            is_nukhba_user,
            campaign_title,
            user_invites_status,
            country_code,
            referred_by,
            device_id,
            total_signedup_user,
            total_verified_user,
            allow_referral: isEmptyField(allow_referral) ? null : Number(allow_referral),
            allow_campaign: isEmptyField(allow_campaign) ? null : Number(allow_campaign),
        });

        response.rows?.map((item) => {
            item['contact_invited'] = Boolean(item.other_details?.user_invites_status)
            item['is_agent'] = item.user_type === 1
            item['license_document'] = item?.license_document ? getUrlFromBucket(item?.license_document) : ''
        })

        return {
            count: response.count,
            rows: response.rows
        };
    }

    static async approveInfluencer(data) {
        let {
            id,
            approved,
            remark,
            commission_type,
            commission,
            dbTransaction,
            user: admin_id
        } = data;
        approved = Number(approved)

        const influencerData = await InfluencersModel.findWithUid(id)
        if(!influencerData){
            throw new ClientError('Influencer not found with this id.')
        }

        let payload = {}
        // approve
        if(approved === Bit.one){
            payload.status = InfluencerApprovalStatus.APPROVED
            if(isEmptyField(influencerData?.approved_at)){
                payload.approved_at = "CURRENT_TIMESTAMP"
            }
            if(isEmptyField(influencerData?.approved_by)){
                payload.approved_by = admin_id
            }
        }
        if(approved === Bit.zero){
            if(isEmptyField(remark)){
                throw new ClientError('Remark required if approval is cancelled.')
            }
            payload.status = InfluencerApprovalStatus.REJECTED
        }
        if(!isEmptyField(remark)){
            payload.remark = remark
        }

        if(approved === Bit.one){
            const updatedUser = await UsersModel.updateOneById({ 
                user_type: USER_TYPE.INFLUENCER
             }, influencerData.user_id,dbTransaction)
        }
        // approve end
        if(approved != Bit.zero){
            if(!isEmptyField(commission_type) && !isEmptyField(commission)){
                const allowedType = Object.values(COMMISSION_TYPE)
                if(!allowedType?.includes(commission_type)){
                    throw new ClientError('Invalid commission_type value.')
                }
                if(commission < 0 ){
                    throw new ClientError('commission cannot go negative.')
                }
                payload.commission_type = commission_type
                if(commission_type === COMMISSION_TYPE.PERCENTAGE){
                    if(commission > 100){
                        throw new ClientError('commission max limit is 100 for percentage')
                    }
                    payload.commission = commission
                }
            }
            if(!isEmptyField(commission )){
                payload.commission = commission
            }
        }
        

        if(Object.keys(payload)?.length === 0 ){
            throw new ClientError('payload must not be empty')
        }

        

        

        await InfluencersModel.updateOneById(payload,influencerData.id)
        return {
            msg: 'Influencer updated.'
        }

    }

    static async updateInfluencer(body) {
        let {
            id,
            commission_type,
            commission,
            dbTransaction
        } = body;

        const influencerData = await InfluencersModel.findWithUid(id)
        if(!influencerData){
            throw new ClientError('Influencer not found with this id.')
        }

        let payload = {}
        
        if(!isEmptyField(commission_type) && !isEmptyField(commission)){
            payload.commission_type = commission_type
            if(commission_type === COMMISSION_TYPE.PERCENTAGE){
                if(commission > 100){
                    throw new ClientError('commission max limit is 100 for percentage')
                }
                payload.commission = commission
            }
        }
        if(!isEmptyField(commission)){
            payload.commission = commission
        }

        if(Object.keys(payload)?.length === 0 ){
            throw new ClientError('payload must not be empty')
        }

        await InfluencersModel.updateOneById(payload,influencerData.id)
        return {
            msg: 'Influencer updated.'
        }

    }
}

module.exports = InfluencerService;

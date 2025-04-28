require("dotenv").config();
const UsersModel = require("../../models/mysql/users.model");
const UserTicketsModel = require("../../models/mysql/userTickets.model");
const NotificationService = require("../../services/admin/notification.service");
const MediaModel = require("../../models/mysql/media.model");
const CampaignModel = require("../../models/mysql/campaign.model.js");
const CouponModel = require("../../models/mysql/coupons.model.js");
const UserInviteModel = require("../../models/mysql/invites.model.js");
const PaymentsModel = require("../../models/mysql/payments.model.js");
const ClientError = require("../../error/clientError");
const ServerError = require("../../error/serverError");
const { UserStatus, Logins, UserTicketsType, Bit, Pagination } = require("../../constants/database");
const { getKeyByValue } = require("../../utils/general");
const { post } = require("../../utils/fetch");
const { updateVariablesInToken } = require("../../utils/userToken");
const { isEmptyField, getTrimmedValue, isEmailValid, formatDecimal, generateTwoDigitNumber, isEmpty } = require("../../utils/common");
const { getUrlFromBucket } = require("../../utils/s3");
const ReferralCodes = require("../../utils/referralcodes.js");
const AdminAuthModel = require("../../models/mysql/admin.model.js");
const { USERNAME_CHAR_LENGTH } = require("../../constants/variables.js");
const referralCodesObject = new ReferralCodes();
const { PaymentStatus, AuthKey, StoreId, GatewayInitiatePaymentUrl, OrderStatusCode } = require("../../constants/payments");

class UserService {

    static async getOtherDetails(data) {
        let { uids } = data;
        const userAllFields = await UsersModel.findUsersWithUid(uids)
        const user_id = userAllFields?.[0].id

        const user_ids = []
        userAllFields?.map((item) => {
            user_ids.push(item.id)
        })

        if (Number(userAllFields.user_type) === Bit.zero) {
            throw new ClientError(CONSTANT_MESSAGES.GENERAL.UNAUTHORIZED)
        }
        let allDetails = await UsersModel.getOtherDetails(user_ids);
        if (!allDetails) {
            return null
        }

        return allDetails

    }


    static async getUsers(data) {
        let {
            page = 1,
            page_size = 10,
            sort_by = 'created_at',
            is_paginated = true,
            user_type = null,
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

        const response = await UsersModel.getUserList({
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
            item['is_agent'] = Boolean(item.user_type)
            item.wallet_data = {
                coins: item.coins,
                credits: formatDecimal(item.credits || 0)
            }
            delete item.coins;
            delete item.credits;
        })

        return {
            count: response.count,
            rows: response.rows
        };
    }

    static async changeUserStatus(data) {
        const { status, user_id } = data;

        let user = await UsersModel.findUserWithUid(user_id);
        if (!user || user.length < 1) {
            throw new ClientError('Invalid user_id');
        }

        user = user[0];

        const userCurrentStatus = getKeyByValue(UserStatus, Number(user.status));

        if (String(status) == userCurrentStatus) {
            throw new ClientError(`User's current status is already ${status}`);
        }

        const userActiveStatus = getKeyByValue(UserStatus, UserStatus.active);

        //deleting user session, if user status from noshow to active
        if (Number(user.status) == Number(UserStatus.noshow) && String(status) == String(userActiveStatus)) {
            updateVariablesInToken({ uid: user.uid, status: UserStatus.active });
        }

        if (String(status) == String(getKeyByValue(UserStatus, UserStatus[status]))) {
            updateVariablesInToken({ uid: user.uid, status: UserStatus[status] });
        }

        const { rows } = await UsersModel.updateOneById({ status: UserStatus[status] }, user.id);
        if (rows != 1) {
            throw new ServerError('Something went wrong while updating user status. Please try again');
        }

        return {
            msg: `User status updated successfully to ${status}`
        }
    }

    static async getDailySignups() {
        // const todaySignups = await UsersModel.
    }

    static async getDailyUsersApi(currentDate, is_nukhba_user, is_pilot) {
        const deviceType = Logins.DeviceType;
        const [android, ios, web] = await Promise.all([UsersModel.findUserWithLastSeen(currentDate, deviceType.ANDROID, is_nukhba_user, is_pilot),
        UsersModel.findUserWithLastSeen(currentDate, deviceType.iOS, is_nukhba_user, is_pilot),
        UsersModel.findUserWithLastSeen(currentDate, deviceType.WEB, is_nukhba_user, is_pilot)]);

        let isActiveUsersFound = false;
        if ((android && android.length > 0) || (ios && ios.length > 0) || (web && web.length > 0)) {
            isActiveUsersFound = true;
        }

        if (isActiveUsersFound) {
            const requestBody = {
                date: currentDate,
                daily_active_users: {
                    android: {
                        count: android?.length || 0,
                        users: android?.map(elem => elem.user) || []
                    },
                    ios: {
                        count: ios?.length || 0,
                        users: ios?.map(elem => elem.user) || []
                    },
                    web: {
                        count: web?.length || 0,
                        users: web?.map(elem => elem.user) || []
                    }
                },
            }

            return requestBody
        } else {
            const requestBody = {
                date: currentDate,
                daily_active_users: {
                    android: {
                        count: android?.length || 0,
                        users: android?.map(elem => elem.user) || []
                    },
                    ios: {
                        count: ios?.length || 0,
                        users: ios?.map(elem => elem.user) || []
                    },
                    web: {
                        count: web?.length || 0,
                        users: web?.map(elem => elem.user) || []
                    }
                },
            }
            return requestBody
        }
    }

    static async addUserTicket(body) {
        const { email, limit } = body;
        let [user] = await UsersModel.findIdWithEmail(email);
        if (!user) {
            throw new ClientError('Invalid user email');
        }
        const ticketInsertArr = Array.from({ length: Number(limit) }, () => ({ user_id: user.id, ref_id: user.id, type: UserTicketsType.LOGIN }))
        UserTicketsModel.insert(ticketInsertArr);
        return { msg: "User Tickets added" }
    }

    static async updateUser(data) {
        const {
            user_id,
            is_pilot,
            user_type
        } = data;

        let [user] = await UsersModel.findUserWithUid(user_id);

        if (!user) {
            throw new ClientError('Invalid User Id');
        }

        const updateObj = {};
        if (!isEmptyField(is_pilot)) {
            updateObj.is_pilot = is_pilot;
        }
        if (!isEmptyField(user_type)) {
            updateObj.user_type = user_type;
            //generate agent_username
            let agent_username
            let agent_username_count;
            do {
                agent_username = referralCodesObject.generateAgentUsernameByName(user.first_name)
                agent_username_count = await UsersModel.isAgentUsernameExists(agent_username)
            } while (agent_username_count[0].count > 0)

            updateObj.agent_username = agent_username
        }

        const { rows } = await UsersModel.updateOneById(updateObj, user.id);
        if (rows != 1) {
            throw new ServerError('Something went wrong while updating user');
        }
        return {
            msg: `User updated successfully`
        }
    }

    static async findTodaySignups(currentDate, is_nukhba_user, is_pilot) {
        const todaySignups = await UsersModel.findTodaySignups(currentDate, is_nukhba_user, is_pilot) || [];

        let android_signups = 0;
        let ios_signups = 0;

        todaySignups?.forEach(elem => {
            if (elem.device_type == 'android') {
                android_signups += Number(elem?.count || 0);
            }
            if (elem.device_type == 'ios') {
                ios_signups += Number(elem?.count || 0);
            }
        })

        const daily_signups = android_signups + ios_signups;

        const result = {
            daily_signups,
            android_signups,
            ios_signups,
        }

        return result;
    }

    static async updateNukhbaUser(data) {
        const {
            user_emails,
            status = 1
        } = data;
        let emailsArray = user_emails?.split(',')
        emailsArray = emailsArray.map((item) => item.trim())

        for (let i = 0; i < emailsArray?.length; i++) {
            const isValid = isEmailValid(emailsArray[i])
            if (!isValid) {
                throw new ClientError('One of email provided is not valid.')
            }
        }

        let userIdsResult = await UsersModel.findIdWithEmailMultiple(emailsArray)
        let userIds = []
        userIdsResult.map((item, i) => userIds.push(item.id))
        if (!userIds?.length) {
            throw new ClientError('None of the emails provided are registered on our platform.')
        }

        const updateObj = {};
        if (!isEmptyField(userIds) && userIds?.length > 0) {
            updateObj.is_nukhba_user = Number(status);
        }
        const { rows } = await UsersModel.updateManyById(updateObj, userIds);
        if (rows < 1) {
            throw new ServerError('Something went wrong while updating user');
        }

        if (userIds?.length !== emailsArray?.length) {
            return {
                msg: `${userIds?.length} out of ${emailsArray?.length} users status are updated.`
            }
        }

        return {
            msg: `Nukhba user status updated for all user.`
        }
    }

    static async getUnusedCouponUsers(data) {
        let {
            page,
            page_size,
            sort_by,
            order,
            is_paginated,
            keyword,
            from_date,
            to_date,
            status,
            is_pilot,
            is_nukhba_user,
            campaign_title,
            user_invites_status,
            country_code,
            user_type = null,
            coupon_id,
            campaign_id
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

        if (isEmptyField(campaign_id) && isEmptyField(coupon_id)) {
            // throw new ClientError("Either Campaign Id or Coupon Id is required");
            const response = await UsersModel.getUserList({
                sort,
                offset,
                limit,
                user_type,
                is_paginated,
                search: keyword,
                status,
                is_pilot,
                from_date,
                to_date,
                is_nukhba_user,
                campaign_title,
                user_invites_status,
                country_code
            });

            return {
                count: response.count,
                rows: response.rows
            };
        }

        if (!isEmptyField(campaign_id)) {
            const [campaign] = await CampaignModel.findOneByuId(campaign_id);
            const [coupon] = await CouponModel.findOneById(campaign.coupon_id);
            coupon_id = coupon.uid;
        }

        const response = await UsersModel.getUnusedCouponUserList({
            sort,
            limit,
            offset,
            keyword,
            is_paginated,
            from_date,
            to_date,
            status,
            is_pilot,
            is_nukhba_user,
            campaign_title,
            user_invites_status,
            country_code,
            user_type,
            coupon_id
        });

        return {
            count: response.count,
            rows: response.rows
        };
    }

    static async sendNotificationsToUsers(data) {
        let {
            user_ids,
            title,
            message,
            icon,
            in_app_only,

            keyword,
            from_date,
            to_date,
            status,
            is_pilot,
            is_nukhba_user,
            campaign_title,
            user_invites_status,
            country_code,
            user_type = null,
            coupon_id,
            campaign_id
        } = data;

        let users = [];
        if (user_ids && user_ids.length) {
            //get users by uids
            users = await UsersModel.getUsersByUids(user_ids)
        } else {
            if (isEmptyField(campaign_id) && isEmptyField(coupon_id)) {
                // throw new ClientError("Either Campaign Id or Coupon Id is required");
                users = await UsersModel.getAllUserList({
                    user_type,
                    keyword,
                    status,
                    is_pilot,
                    from_date,
                    to_date,
                    is_nukhba_user,
                    campaign_title,
                    user_invites_status,
                    country_code
                });
                console.log("hell")
            } else {
                if (!isEmptyField(campaign_id)) {
                    const [campaign] = await CampaignModel.findOneByuId(campaign_id);
                    const [coupon] = await CouponModel.findOneById(campaign.coupon_id);
                    coupon_id = coupon.uid;
                }

                users = await UsersModel.getAllUnusedCpnUsrList({
                    keyword,
                    from_date,
                    to_date,
                    status,
                    is_pilot,
                    is_nukhba_user,
                    campaign_title,
                    user_invites_status,
                    country_code,
                    user_type,
                    coupon_id
                });
            }
        }

        //get image
        if (!isEmptyField(icon)) {
            const [getMediaId] = await MediaModel.getOneByuId(icon);
            if (!getMediaId)
                throw new ClientError("icon not found");
            // updateObj.icon = getMediaId.id
            icon = getUrlFromBucket(`${getMediaId?.basePath}/${getMediaId?.filename}`);
        }

        //loop over suer 
        for (let user of users) {
            NotificationService.sendNotificationToUser({ title: title, message: message, image: { imageUrl: icon }, user: { id: user.id, fcmToken: user.fcm_token }, inAppOnly: in_app_only });
        }

        return { msg: "Notification send successfully" };
    }

    static async getAdminUsers(data) {
        let {
            page = 1,
            page_size = 10,
            sort_by = 'created_at',
            is_paginated = true,
            order = 'desc',
            keyword = null,
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

        const response = await AdminAuthModel.subAdminList({
            sort,
            offset,
            limit,
            user_type,
            is_paginated,
            keyword
        })

        return {
            count: response.count,
            rows: response.rows
        };
    }

    static async checkUserExist(body) {
        let { country_code, mobile } = body;
        const result = await UsersModel.getUserCountUsingMobile(country_code, mobile)

        return result
    }

    static async updateUserInviteStatus(data) {
        const {
            user_invite_id,
            status,
            ...rest
        } = data;

        let [userInvite] = await UserInviteModel.getOneByColumns({columns: ['uid'], values: [user_invite_id]});

        if (!userInvite) {
            throw new ClientError('Invalid User Invite Id');
        }

        const updateObj = {};
        let updateOtherDetails = {};
        if (!isEmptyField(status)) {
            updateObj.msg_delivered = status;
            // updateOtherDetails.status = status;
        }
        if(rest && Object.keys(rest).length){
            updateOtherDetails = rest;
        }
    
        if(Object.keys(updateOtherDetails).length){
            updateObj.details = { ...userInvite.details, ...updateOtherDetails }
        }
        const { rows } = await UserInviteModel.updateOneById(updateObj, userInvite.id);
        if (rows != 1) {
            throw new ServerError('Something went wrong while updating user');
        }
        return {
            msg: `User updated successfully`
        }
    }

    static async updateUsernameScript(body){
        const { dbTransaction  } = body
        const users = await UsersModel.getUsersHavingNoUsername(dbTransaction)
        let noOfUsernameUpdated = 0
        let noOfDuplicateGenerated = 0

        for(let i= 0 ; i < users?.length ;i++){
            const item = users[i]
            let first_name = item?.first_name
            let last_name = item?.last_name
            let usernameInserted = false
            do{
                let username = ''
                if(first_name?.length >= USERNAME_CHAR_LENGTH){
                    username = first_name.substring(0,USERNAME_CHAR_LENGTH) + '' + generateTwoDigitNumber()
                }else{
                    if(isEmpty(last_name)){
                        username = first_name + '' + generateTwoDigitNumber()
                    }else{
                        const initialChar = last_name.substring(0,USERNAME_CHAR_LENGTH - first_name?.length)
                        username = first_name + initialChar + generateTwoDigitNumber()
                    }
                }
                username = username?.replace(/\s/g, '')?.toLowerCase();
                const payload = {
                    username:username,
                }
                const [userRes] = await UsersModel.findUserWithUsername(username,dbTransaction)
                if(isEmpty(userRes)){
                    const res = await UsersModel.updateOneById(payload,item?.id,dbTransaction)
                    if(res.rows === Bit.one){
                        usernameInserted = true
                        noOfUsernameUpdated++
                    }
                }else{
                    noOfDuplicateGenerated++
                }
            }while(usernameInserted === false)
            
        }
        return { 
            msg : 'usernames updated successfully',
            updated_rows:noOfUsernameUpdated,
            duplicate_generated:noOfDuplicateGenerated}
    }

    static async getPaymentInfo(body) {
        const {payment_id, ref_txn_id} = body;
        // if(isEmptyField(payment_id))
        //     throw new ClientError("Payment Id is required")

        // const [paymentExist] = await PaymentsModel.getOneByColumns({
        //     columns: ['uid'],
        //     values: [payment_id]
        //   });

        if(isEmptyField(ref_txn_id))
            throw new ClientError("Reference Id is required")

        const [paymentExist] = await PaymentsModel.getOneByColumns({
            columns: ['ref_txn_id'],
            values: [ref_txn_id]
        });

        if(!paymentExist || !paymentExist?.ref_txn_id)
            throw new ClientError("No Telr Payment found")
      
        const paymentStatusResult = await this.getPaymentInfoByRefTxnId(paymentExist.ref_txn_id);
        const orderStatusCode = paymentStatusResult?.order?.status?.code;

        if(orderStatusCode != paymentExist.order_status_code){
            let paymentStatus = orderStatusCode == OrderStatusCode.paid ? PaymentStatus.completed.value : PaymentStatus.failed.value;
            const updateObj = { 
                // status: PaymentStatus.completed.value, 
                status: paymentStatus, 
                order_status_code: orderStatusCode
            }
            if(paymentStatus == PaymentStatus.failed.value && paymentExist.status == PaymentStatus.clickedBack.value){
                delete updateObj.status;
            }
          
            await PaymentsModel.updateOneById(updateObj, paymentExist.id);
        }
    
        return paymentStatusResult;
      }

    static async getPaymentInfoByRefTxnId(refTxnId) {
        const payload = {
          "method": "check",
          "store": StoreId,
          "authkey": AuthKey,
          "order": {
            "ref": refTxnId
          }
        };
    
        const paymentStatusResult = await post({ url: GatewayInitiatePaymentUrl, body: payload, headers: {} });
        // let paymentStatus = paymentStatusResult?.data?.order?.status?.code === 3 ? PaymentStatus.completed : PaymentStatus.failed;
    
        return {
        //   status: paymentStatus,
          ...paymentStatusResult?.data
        };
      }
}

module.exports = UserService;

require("dotenv").config();
const UserEventsModel = require("../../models/mysql/userEvents.model.js");

const UserPointsModel = require("../../models/mysql/userPoints.model.js");
const UsersModel = require("../../models/mysql/users.model.js");
const RestaurantModel = require("../../models/mysql/restaurants.model.js");

const NotificationTemplateService = require("../admin/notificationTemplate.service");

const ServerError = require("../../error/serverError.js");
const { getFromAndToDateOfMonth, formatDate } = require("../../utils/moment.js");
const { NOTIFICATION_TEMPLATE_KEYWORD } = require("../../constants/notificationTemplate");
const { replaceStringVar, isEmptyField } = require("../../utils/common.js");
const {  NotificationImageType } = require("../../constants/variables");
const { sendPushNotificationToDevice } = require("../../utils/pushNotification");

const { 
    NUKHBA_POINTS, 
    USER_EVENTS_TYPE, 
    USER_POINTS_TYPE, 
    POINT_TYPE_DESC,
    USER_POINTS_MONTHLY_LIMIT,
    USER_TYPE,
    COMMISSION_TYPE
} = require("../../constants/database.js");

const { connection } = require("../../dbConfig/dbConnect.js");

class UserEventService {
    static pushNotificationArr = [];

    static async initiateCoinProcessing() {
        let transaction;
        try {
            //fetchinng transaction connection
            transaction = await connection().getConnection();
            //beiginning transaction
            await transaction.beginTransaction();

            // fetching all the user events for which coins has to be transferred
            // this must be processed with transaction

            // finding referral events
            const referralPromise = UserEventService.getReferralCoins(transaction);

            // finding restaurant rating events
            const restaurantRatingPromise = UserEventService.getRestaurantRatingCoins(transaction);

            // finding pre booking events
            const preBookingPromise = UserEventService.getPreBookingCoins(transaction);

            // finding instant payment events
            const instantPaymentPromise = UserEventService.getInstantPaymentCoins(transaction);

            // finding referred user dining events
            const referredUserDiningPromise = UserEventService.getReferredUserDiningCoins(transaction);

            // finding deal purchase events
            const dealPurchasePromise = UserEventService.getDealPurchaseCoins(transaction);

            // handle all the other events here

            //Bulk fetch all data
            const data = await Promise.all([referralPromise, restaurantRatingPromise, preBookingPromise, instantPaymentPromise, referredUserDiningPromise, dealPurchasePromise]);


            let userEventIds = await UserEventService.transferCoins(data, transaction);
            userEventIds = userEventIds.flat(Infinity);

            //marking all the events as processed
            if (userEventIds.length > 0) await UserEventsModel.markAsProcessed({ ids: userEventIds, transaction })

            //committing the transaction
            if (transaction) {
                await transaction.commit();
                console.log("TRANSACTION COMMIT");
            }
            Promise.allSettled(this.pushNotificationArr).then(el=> {this.pushNotificationArr = []});

            return 1;
        } catch (error) {
            console.error(error);
            if (transaction) {
                await transaction.rollback();
                console.log("TRANSACTION ROLLBACK");
            }
            return 0;
        } finally {
            if (transaction) {
                transaction.release();
                console.log("TRANSACTION RELEASE");
            }
            return 1;
        }
    }

    static async validateCurrentMonthLimit({ eventType, monthlyLimit, transaction, userId }) {
        const { from, to } = getFromAndToDateOfMonth();
        const rewardedRows = await UserEventsModel.checkMonthlyLimit({
            eventType, from, to, transaction, userId
        });

        const rewardedRowIds = rewardedRows?.map(row => row.id);

        if (rewardedRowIds.length >= monthlyLimit) {
            return {
                status: false,
            };
        }
        return {
            status: true,
            processCount: monthlyLimit - rewardedRowIds.length,
        };
    }

    static async markIgnoreWhenLimitOver({ eventType, transaction, userId }) {
        // finding all the user events ids that needs to be ignored as monthly limit has been exceeded for current month for given userId
        const result = await UserEventsModel.findOnlyId({ eventType, transaction, userId });
        const userEventIds = result?.map(elem => elem.id);
        if (userEventIds.length > 0) {
            //marking user events ids as ignore
            await UserEventsModel.markAsIgnore({ ids: userEventIds, transaction })
        }
        return 1;
    }

    static async markAsIgnoreWhenFewLimitsLeft({ result, transaction }) {
        //marking user events ids as ignore
        await UserEventsModel.markAsIgnore({ ids: result, transaction })
        return 1;
    }

    static async getReferralCoins(transaction) {
        // find all the entries that are not processed for all the users
        const result = await UserEventsModel.findReferralCoins({ eventType: USER_EVENTS_TYPE.REFERRAL, transaction });
        return result;
    }

    static async getRestaurantRatingCoins(transaction) {
        // find all the entries that are not processed
        const result = await UserEventsModel.findResturantRatingCoins({ eventType: USER_EVENTS_TYPE.RESTAURANT_RATING, transaction });
        return result;
    }

    static async getPreBookingCoins(transaction) {
        // find all the entries that are not processed
        const result = await UserEventsModel.getPreBookingCoins({ eventType: USER_EVENTS_TYPE.PRE_BOOKING, transaction });
        return result;
    }

    static async getInstantPaymentCoins(transaction) {
        // find all the entries that are not processed
        const result = await UserEventsModel.getInstantPaymentCoins({ eventType: USER_EVENTS_TYPE.INSTANT_PAYMENT, transaction });
        return result;
    }

    static async getReferredUserDiningCoins(transaction) {
        // find all the entries that are not processed
        const result = await UserEventsModel.getReferredUserDiningCoins({ eventType: USER_EVENTS_TYPE.REFERRED_USER_DINNING, transaction });
        return result;
    }

    static async getDealPurchaseCoins(transaction) {
        // find all the entries that are not processed
        const result = await UserEventsModel.getDealPurchaseCoins({ eventType: USER_EVENTS_TYPE.DEALS_PURCHASED, transaction });
        return result;
    }

    static async transferCoins(data, transaction) {
        const [referral, rating, preBooking, instantPayment, referredUserDining, dealPurchase] = data;

        let userEventIds = [];
        let refUserEventIds = [];
        let ratUserEventIds = [];
        let preBookingEventIds = [];
        let instantPaymentEventIds = [];
        let referredUserDiningEventIds = [];
        let dealPurchaseEventIds = [];

        if (referral.length > 0) {
            refUserEventIds = await UserEventService.transferReferralCoins(referral, transaction);
        }

        if (rating.length > 0) {
            ratUserEventIds = await UserEventService.transferRestaurantRatingCoins(rating, transaction);
        }

        if (preBooking.length > 0) {
            preBookingEventIds = await UserEventService.transferPreBookingCoins(preBooking, transaction);
        }

        if (instantPayment.length > 0) {
            instantPaymentEventIds = await UserEventService.transferInstantPaymentCoins(instantPayment, transaction);
        }

        if (referredUserDining.length > 0) {
            referredUserDiningEventIds = await UserEventService.transferReferredUserDiningCoins(referredUserDining, transaction);
        }

        if (dealPurchase.length > 0) {
            dealPurchaseEventIds = await UserEventService.transferDealPurchaseCoins(dealPurchase, transaction);
        }

        // merge all the user event ids into one
        userEventIds = [
            ...refUserEventIds, 
            ...ratUserEventIds, 
            ...preBookingEventIds, 
            ...instantPaymentEventIds, 
            ...referredUserDiningEventIds,
            ...dealPurchaseEventIds
        ];
        return userEventIds;
    }

    static async transferReferralCoins(referral, transaction) {
        const userEventIds = [];
        const userPointsArr = [];
        // const pushNotificationArr = []
        let referralCount = 0;
        const pointType = USER_POINTS_TYPE.REFERRAL

        for (let r of referral) {
            const userId = r.user_id;
            //validating current limit for each user
            const monthlyLimit = USER_POINTS_MONTHLY_LIMIT.REFERRAL;
            const { status, processCount } = await UserEventService.validateCurrentMonthLimit({
                eventType: USER_EVENTS_TYPE.REFERRAL, monthlyLimit, transaction, userId
            });

            if (!status) {
                // finding all the user events ids that needs to be ignored as monthly limit has been exceeded for current month
                await UserEventService.markIgnoreWhenLimitOver({ eventType: USER_EVENTS_TYPE.REFERRAL, transaction, userId })
                continue;
            }

            let refDetails = r.data;

            if (refDetails.length > processCount) {
                //if current user events exceeds permissible monthly limit then some user events needs to be processed and rest has to be ignored
                refDetails = refDetails.slice(0, processCount);
                const userEventToBeIgnored = r.data.slice(processCount).map(elem => elem.id).flat();
                await UserEventService.markAsIgnoreWhenFewLimitsLeft({ result: userEventToBeIgnored, transaction })
            }

            for (let refData of refDetails) {
                const isUserPointExist = await UserPointsModel.getAllByColumnsByInQuery({columns : ['user_id', 'referral_user_id', 'points_type'], values : [[userId], [refData.referral_user_id], [pointType]]}, transaction);
                if(isUserPointExist && isUserPointExist.length){
                    await UserEventsModel.markAsIgnore({ ids: [refData.id], transaction });
                } else {
                    referralCount++;
                    const userPoints = {
                        user_id: userId,
                        points: NUKHBA_POINTS.REFERRAL,
                        points_type: USER_POINTS_TYPE.REFERRAL,
                        referral_user_id: refData.referral_user_id,
                        user_event_id: refData.id
                    }
                    const [userData] = await UsersModel.getUserDataById(userId, transaction);
                    await this.addInfluencerCommission(userId, userData, userPoints, transaction);
                    await this.addUserEventNotification({
                        // pushNotificationArr, 
                        userData, 
                        userPointObj: userPoints, 
                        referredUserId: refData.referral_user_id,
                        eventData: { created_at: refData.created_at, event_type: userPoints.points_type }
                    },transaction)
                    userEventIds.push(refData.id);
                    userPointsArr.push(userPoints);
                }
            }
        }

        if (userPointsArr.length < 1) {
            return [];
        }

        const { rows } = await UserPointsModel.insert(userPointsArr, transaction);
        // Promise.allSettled(pushNotificationArr)

        if (rows != referralCount) throw new ServerError("Something went wrong while transferring referral coins");
        return userEventIds;
    }

    static async transferRestaurantRatingCoins(rating, transaction) {
        const userEventIds = [];
        const userPointsArr = [];
        let ratingCount = 0;
        for (let r of rating) {
            const userId = r.user_id;
            //validating current limit for each user
            const monthlyLimit = USER_POINTS_MONTHLY_LIMIT.RESTAURANT_RATING;
            const { status, processCount } = await UserEventService.validateCurrentMonthLimit({
                eventType: USER_EVENTS_TYPE.RESTAURANT_RATING, monthlyLimit, transaction, userId: userId,
            });

            if (!status) {
                // finding all the user events ids that needs to be ignored as monthly limit has been exceeded for current month
                await UserEventService.markIgnoreWhenLimitOver({ eventType: USER_EVENTS_TYPE.RESTAURANT_RATING, transaction, userId })
                continue;
            }

            let ratingDetails = r.data;

            if (ratingDetails.length > processCount) {
                //if current user events exceeds permissible monthly limit then some user events needs to be processed and rest has to be ignored
                ratingDetails = ratingDetails.slice(0, processCount);
                const userEventToBeIgnored = r.data.slice(processCount).map(elem => elem.id).flat();
                await UserEventService.markAsIgnoreWhenFewLimitsLeft({ result: userEventToBeIgnored, transaction })
            }

            for (let ratingData of ratingDetails) {
                ratingCount++;
                const userPoints = {
                    user_id: userId,
                    points: NUKHBA_POINTS.RESTAURANT_RATING,
                    points_type: USER_POINTS_TYPE.RESTAURANT_RATING,
                    // referral_user_id: ratingData.referral_user_id,
                    user_event_id: ratingData.id
                }
                const [userData] = await UsersModel.getUserDataById(userId, transaction);
                await this.addInfluencerCommission(userId, userData, userPoints, transaction);
                await this.addUserEventNotification({
                    // pushNotificationArr, 
                    userData, 
                    userPointObj: userPoints, 
                    // restaurantId: preBookingData.restaurant_id,
                    eventData: { created_at: ratingData.created_at, event_type: userPoints.points_type }
                },transaction)
                userEventIds.push(ratingData.id);
                userPointsArr.push(userPoints);
            }
        }

        if (userPointsArr.length < 1) {
            return [];
        }

        const { rows } = await UserPointsModel.insert(userPointsArr, transaction);
        if (rows != ratingCount) throw new ServerError("Something went wrong while transferring referral coins");
        return userEventIds;
    }

    static async transferPreBookingCoins(preBooking, transaction) {
        const userEventIds = [];
        const userPointsArr = [];
        // const pushNotificationArr = [];
        let preBookingCount = 0;
        for (let r of preBooking) {
            const userId = r.user_id;
            //validating current limit for each user
            const monthlyLimit = USER_POINTS_MONTHLY_LIMIT.RESERVATIONS;
            const { status, processCount } = await UserEventService.validateCurrentMonthLimit({
                eventType: USER_EVENTS_TYPE.PRE_BOOKING, monthlyLimit, transaction, userId: userId,
            });

            if (!status) {
                // finding all the user events ids that needs to be ignored as monthly limit has been exceeded for current month
                await UserEventService.markIgnoreWhenLimitOver({ eventType: USER_EVENTS_TYPE.PRE_BOOKING, transaction, userId })
                continue;
            }

            let preBookingDetails = r.data;

            if (preBookingDetails.length > processCount) {
                //if current user events exceeds permissible monthly limit then some user events needs to be processed and rest has to be ignored
                preBookingDetails = preBookingDetails.slice(0, processCount);
                const userEventToBeIgnored = r.data.slice(processCount).map(elem => elem.id).flat();
                await UserEventService.markAsIgnoreWhenFewLimitsLeft({ result: userEventToBeIgnored, transaction })
            }

            for (let preBookingData of preBookingDetails) {
                preBookingCount++;
                const userPoints = {
                    user_id: userId,
                    points: NUKHBA_POINTS.RESERVATIONS,
                    points_type: USER_POINTS_TYPE.RESERVATION,
                    reservation_id: preBookingData.reservation_id,
                    user_event_id: preBookingData.id
                }
                const [userData] = await UsersModel.getUserDataById(userId, transaction);
                await this.addInfluencerCommission(userId, userData, userPoints, transaction);
                await this.addUserEventNotification({
                    // pushNotificationArr, 
                    userData, 
                    userPointObj: userPoints, 
                    restaurantId: preBookingData.restaurant_id,
                    eventData: { created_at: preBookingData.created_at, event_type: userPoints.points_type }
                },transaction)
                userEventIds.push(preBookingData.id);
                userPointsArr.push(userPoints);
            }
        }

        if (userPointsArr.length < 1) {
            return [];
        }

        const { rows } = await UserPointsModel.insert(userPointsArr, transaction);
        // Promise.allSettled(pushNotificationArr)
        if (rows != preBookingCount) throw new ServerError("Something went wrong while transferring referral coins");
        return userEventIds;
    }

    static async transferInstantPaymentCoins(userEvents, transaction) {
        const userEventIds = [];
        const userPointsArr = [];
        let usrEventCount = 0;
        const eventType = USER_EVENTS_TYPE.INSTANT_PAYMENT;
        const monthlyLimit = USER_POINTS_MONTHLY_LIMIT.INSTANT_PAYMENT;
        const  pointsToAssign = NUKHBA_POINTS.INSTANT_PAYMENT;
        const pointType = USER_POINTS_TYPE.INSTANT_PAYMENT

        for (let event of userEvents) {
            const userId = event.user_id;
            //validating current limit for each user
            const { status, processCount } = await UserEventService.validateCurrentMonthLimit({
                eventType: eventType, monthlyLimit, transaction, userId: userId,
            });

            if (!status) {
                // finding all the user events ids that needs to be ignored as monthly limit has been exceeded for current month
                await UserEventService.markIgnoreWhenLimitOver({ eventType: eventType, transaction, userId })
                continue;
            }

            let eventDetails = event.data;

            if (eventDetails.length > processCount) {
                //if current user events exceeds permissible monthly limit then some user events needs to be processed and rest has to be ignored
                eventDetails = eventDetails.slice(0, processCount);
                const userEventToBeIgnored = event.data.slice(processCount).map(elem => elem.id).flat();
                await UserEventService.markAsIgnoreWhenFewLimitsLeft({ result: userEventToBeIgnored, transaction })
            }

            for (let eventData of eventDetails) {
                usrEventCount++;
                const userPoints = {
                    user_id: userId,
                    points: pointsToAssign,
                    points_type: pointType,
                    reservation_id: eventData.reservation_id,
                    user_event_id: eventData.id
                }
                const [userData] = await UsersModel.getUserDataById(userId, transaction);
                await this.addInfluencerCommission(userId, userData, userPoints, transaction);
                await this.addUserEventNotification({
                    // pushNotificationArr, 
                    userData, 
                    userPointObj: userPoints, 
                    restaurantId: eventData.restaurant_id,
                    eventData: { created_at: eventData.created_at, event_type: userPoints.points_type }
                },transaction)
                userEventIds.push(eventData.id);
                userPointsArr.push(userPoints);
            }
        }

        if (userPointsArr.length < 1) {
            return [];
        }

        const { rows } = await UserPointsModel.insert(userPointsArr, transaction);
        if (rows != usrEventCount) throw new ServerError("Something went wrong while transferring referral coins");
        return userEventIds;
    }

    static async transferReferredUserDiningCoins(userEvents, transaction) {
        const userEventIds = [];
        const userPointsArr = [];
        let usrEventCount = 0;
        const eventType = USER_EVENTS_TYPE.REFERRED_USER_DINNING;
        const monthlyLimit = USER_POINTS_MONTHLY_LIMIT.REF_FRIEND_FIRST_DINNING;
        const  pointsToAssign = NUKHBA_POINTS.REF_FRIEND_FIRST_DINNING;
        const pointType = USER_POINTS_TYPE.REF_FRIEND_FIRST_DINNING

        for (let event of userEvents) {
            const userId = event.user_id;
            //validating current limit for each user
            const { status, processCount } = await UserEventService.validateCurrentMonthLimit({
                eventType: eventType, monthlyLimit, transaction, userId: userId,
            });

            if (!status) {
                // finding all the user events ids that needs to be ignored as monthly limit has been exceeded for current month
                await UserEventService.markIgnoreWhenLimitOver({ eventType: eventType, transaction, userId })
                continue;
            }

            let eventDetails = event.data;

            if (eventDetails.length > processCount) {
                //if current user events exceeds permissible monthly limit then some user events needs to be processed and rest has to be ignored
                eventDetails = eventDetails.slice(0, processCount);
                const userEventToBeIgnored = event.data.slice(processCount).map(elem => elem.id).flat();
                await UserEventService.markAsIgnoreWhenFewLimitsLeft({ result: userEventToBeIgnored, transaction })
            }

            for (let eventData of eventDetails) {
                //check if user already received points
                const isUserPointExist = await UserPointsModel.getAllByColumnsByInQuery({columns : ['user_id', 'points_type'], values : [[userId], [pointType]]}, transaction);
                if(isUserPointExist && isUserPointExist.length){
                    await UserEventsModel.markAsIgnore({ ids: [eventData.id], transaction });
                } else {
                    usrEventCount++;
                    const userPoints = {
                        user_id: userId,
                        points: pointsToAssign,
                        points_type: pointType,
                        reservation_id: eventData.reservation_id,
                        referral_user_id: eventData.referral_user_id,
                        user_event_id: eventData.id
                    }
                    const [userData] = await UsersModel.getUserDataById(userId, transaction);
                    await this.addInfluencerCommission(userId, userData, userPoints, transaction);
                    await this.addUserEventNotification({
                        // pushNotificationArr, 
                        userData, 
                        userPointObj: userPoints, 
                        restaurantId: eventData.restaurant_id,
                        eventData: { created_at: eventData.created_at, event_type: userPoints.points_type }
                    },transaction)
                    userEventIds.push(eventData.id);
                    userPointsArr.push(userPoints);
                }
            }
        }

        if (userPointsArr.length < 1) {
            return [];
        }

        const { rows } = await UserPointsModel.insert(userPointsArr, transaction);
        if (rows != usrEventCount) throw new ServerError("Something went wrong while transferring referral coins");
        return userEventIds;
    }

    static async transferDealPurchaseCoins(userEvents, transaction) {
        const userEventIds = [];
        const userPointsArr = [];
        let usrEventCount = 0;
        const eventType = USER_EVENTS_TYPE.DEALS_PURCHASED;
        const monthlyLimit = USER_POINTS_MONTHLY_LIMIT.DEAL_PURCHASED;
        const  pointsToAssign = NUKHBA_POINTS.DEAL_PURCHASED;
        const pointType = USER_POINTS_TYPE.DEAL_PURCHASED

        for (let event of userEvents) {
            const userId = event.user_id;
            //validating current limit for each user
            const { status, processCount } = await UserEventService.validateCurrentMonthLimit({
                eventType: eventType, monthlyLimit, transaction, userId: userId,
            });

            if (!status) {
                // finding all the user events ids that needs to be ignored as monthly limit has been exceeded for current month
                await UserEventService.markIgnoreWhenLimitOver({ eventType: eventType, transaction, userId })
                continue;
            }

            let eventDetails = event.data;

            if (eventDetails.length > processCount) {
                //if current user events exceeds permissible monthly limit then some user events needs to be processed and rest has to be ignored
                eventDetails = eventDetails.slice(0, processCount);
                const userEventToBeIgnored = event.data.slice(processCount).map(elem => elem.id).flat();
                await UserEventService.markAsIgnoreWhenFewLimitsLeft({ result: userEventToBeIgnored, transaction })
            }

            for (let eventData of eventDetails) {
                usrEventCount++;
                const userPoints = {
                    user_id: userId,
                    points: pointsToAssign,
                    points_type: pointType,
                    deal_id: eventData.deal_id,
                    user_event_id: eventData.id
                }
                const [userData] = await UsersModel.getUserDataById(userId, transaction);
                await this.addInfluencerCommission(userId, userData, userPoints, transaction);
                await this.addUserEventNotification({
                    // pushNotificationArr, 
                    userData, 
                    userPointObj: userPoints, 
                    restaurantId: eventData.restaurant_id,
                    eventData: { created_at: eventData.created_at, event_type: userPoints.points_type }
                },transaction)
                userEventIds.push(eventData.id);
                userPointsArr.push(userPoints);
            }
        }

        if (userPointsArr.length < 1) {
            return [];
        }

        const { rows } = await UserPointsModel.insert(userPointsArr, transaction);
        if (rows != usrEventCount) throw new ServerError("Something went wrong while transferring referral coins");
        return userEventIds;
    }

    static async addInfluencerCommission(userId, userData, userPointObj, transaction) {
        //check if user is influencer and get its commission user_type == 2
        //if yes then assign commission
        // userPoints.commission = user.commission
        if(isEmptyField(userData))
            [userData] = await UsersModel.getUserDataById(userId, transaction);
        if(userData.referee_type == USER_TYPE.INFLUENCER){
            const commissionType = userData.influencer_commission_type;
            let commission = userData.influencer_commission;
            userPointObj.influencer_commission = commissionType == COMMISSION_TYPE.FLAT ? Number(commission) : (Number(userPointObj?.points)*Number(commission))/100;
        } else {
            userPointObj.influencer_commission = 0;
        }
        return userPointObj;
    }

    static async addUserEventNotification({pushNotificationArr, userId, referredUserId, restaurantId, userData, userPointObj, eventData, otherParamInfo}, transaction) {
        let referredUserData, restaurantData;
        
        if(isEmptyField(userData))
            [userData] = await UsersModel.getUserDataById(userId, transaction);

        // if(!isEmptyField(referredUserId))
        //     [referredUserData] = await UsersModel.getUserDataById(referredUserId, transaction);

        // if(!isEmptyField(restaurantId))
        //     [restaurantData] = await RestaurantModel.getDataById(restaurantId, transaction);

        // const { title, message, image, other_details } = await NotificationTemplateService.getNotificationDetailsByKeyword(NOTIFICATION_TEMPLATE_KEYWORD.BOOKING_REMINDER);
        const notificationTemplate = await NotificationTemplateService.getNotificationDetailsByKeyword(NOTIFICATION_TEMPLATE_KEYWORD.USER_EVENT);
        // let notificationMsg = notificationTemplate.other_details[eventData.event_type].message;
        // const replaceStringVarObj = {
        //     '{{points}}': userPointObj?.points,
        //     '{{referredUserName}}': referredUserData?.first_name,
        //     '{{restaurantName}}': restaurantData?.name,
        //     '{{date}}': formatDate(eventData?.created_at)
        // }
        // notificationMsg = replaceStringVar(notificationMsg, replaceStringVarObj)

        let notificationMsg = notificationTemplate.message;
        const replaceStringVarObj = {
            '{{points}}': userPointObj?.points,
            '{{activity}}': POINT_TYPE_DESC[eventData.event_type].text
        }
        notificationMsg = replaceStringVar(notificationMsg, replaceStringVarObj)


        this.pushNotificationArr.push(
            sendPushNotificationToDevice(
                {
                    title: notificationTemplate.title,
                    message: notificationMsg,
                    fcmToken: userData.fcm_token,
                    type: NotificationImageType.WITHOUT_IMAGE,
                }
            )
        )

        return pushNotificationArr;
    }
}

module.exports = UserEventService;

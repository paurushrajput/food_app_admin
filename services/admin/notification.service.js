const NotificationModel = require("../../models/mysql/notificationMaster.model");
const UserNotificationModel = require("../../models/mysql/userNotification.model");
const MediaModel = require("../../models/mysql/media.model");
const RestaurantsModel = require("../../models/mysql/restaurants.model");
const TournamentsModel = require("../../models/mysql/tournaments.model");
const UsersModel = require("../../models/mysql/users.model");
const ClientError = require("../../error/clientError");
const ServerError = require("../../error/serverError");
const { getUrlFromBucket } = require("../../utils/s3");
const { sendPushNotificationToTopic, sendPushNotificationToDevice } = require("../../utils/pushNotification");
const { NotificationActionType } = require("../../constants/notification");
const { isEmptyField } = require("../../utils/common.js");
const { NotificationImageType } = require("../../constants/variables");

class NotificationService {

    static async getNotificationList(data) {
        const { page = 1, page_size = 10, is_paginated = true, sort_by = 'id', order = 'desc' } = data;
        const limit = Number(page_size);
        const offset = (Number(page) - 1) * Number(page_size);
        const response = await UserNotificationModel.getNonUserSpecificNotification({ page, page_size, limit, offset, is_paginated, sort_by, order });
        return {
            count: response.count,
            row: response?.rows?.map(each => {
                return {
                    ...each,
                    image: getUrlFromBucket(each.image)
                }
            })
        };
    }

    static async addNew(data) {
        let {
            topic,
            title,
            device_type,
            type,
            image,
            message,
            html_description,
            description,
            action_url,
            action_type,
            action_button_name,
            res_id
        } = data;

        const notificationObj = {
            topic,
            title,
            device_type,
            type,
            message,
            html_description,
            description,
            action_url, //action
            action_type, //action_screen
            action_button_name
        };
        let media;
        if (!isEmptyField(image)) {
            [media] = await MediaModel.getOneByuId(image);
            if (media) {
                notificationObj['image'] = media.id;
                image = getUrlFromBucket(`${media?.basePath} ${media?.filename}`);
            } else {
                image = undefined;
            }
        }

        if (action_type === NotificationActionType.restaurant.key) {
            if (!res_id)
                throw new ClientError('Restaurant ID is required');
            let [restaurant] = await RestaurantsModel.findRestaurantById(res_id);
            if (!restaurant) {
                throw new ClientError('Invalid Restaurant ID');
            }
            notificationObj.action_type = NotificationActionType.restaurant.key;
            notificationObj.action_url = `${NotificationActionType.restaurant.value}&res_id=${restaurant.uid}`;
            notificationObj.res_id = restaurant.id;
        } else if (action_type === NotificationActionType.game.key) {
            const liveTournamentPromise = TournamentsModel.getLiveTournamentDetails() || [];
            const completedTournamentPromise = TournamentsModel.getCompletedTournamentDetails() || [];
            const [[liveTournament], [completedTournament]] = await Promise.all([liveTournamentPromise, completedTournamentPromise])
            if (!liveTournament && !completedTournament) {
                throw new ClientError('No active or completed tournament found');
            }
            let tournament = liveTournament || completedTournament;
            notificationObj.action_type = NotificationActionType.game.key;
            notificationObj.action_url = `${NotificationActionType.game.value}&tournament_id=${tournament.uid}&game_id=${tournament.game_id}`;
            notificationObj.tournament_id = tournament.id;
        }

        const { rows } = await NotificationModel.insert(notificationObj);
        if (rows < 1) {
            throw new ServerError('Unable to insert notification')
        }

        const { success, result, err } = await sendPushNotificationToTopic({ title, message, topic, image });
        if (!success) {
            throw new ServerError(err);
        }
        return result;
    }

    static async sendNotificationToUser(data, dbTransaction) {
        const { title, message, image: { imageId = null, imageUrl = null }, user, inAppOnly = false } = data;
        const notificationObj = { title, message, user_id: user.id };
        let media;
        let image;
        if (imageId != null && imageId != '') {
            [media] = await MediaModel.getOneByuId(image.id);
            if (media) {
                notificationObj['image'] = media.id;
                image = getUrlFromBucket(`${media?.basePath} ${media?.filename}`);
            } else {
                if (imageUrl != null && imageUrl != '') {
                    image = imageUrl;
                } else {
                    image = undefined;
                }
            }
        } else if (imageUrl != null || imageUrl != '') {
            notificationObj['image_url'] = imageUrl;
            image = imageUrl;
        }

        const { rows } = await NotificationModel.insert(notificationObj, dbTransaction);
        if (rows < 1) {
            throw new ServerError('Unable to send notification');
        }
        if (inAppOnly) {
            return true;
        }

        //if fcmToken does not exists, find it from database
        let fcmToken = user?.fcmToken || undefined;
        if (!fcmToken) {
            const [existingUser] = await UsersModel.findUserWithId(user.id);
            if (!existingUser || !existingUser?.fcm_token) {
                return
            }
        }
        // const [logins] = await LoginsModel.findDeviceTypeByUserId(user.id);
        const { success, result, err } = sendPushNotificationToDevice({ title, message, fcmToken, type: NotificationImageType.WITH_IMAGE, image });
        // const { success, result, err } = sendPushNotificationToDevice({ title, message, fcmToken, device: logins?.device_type });
        // const { success, result, err } = await sendPushNotificationToDevice({ title, message, fcmToken: fcmToken, type: NotificationImageType.WITH_IMAGE, image });

        if (!success) {
            throw new ServerError(err);
        }
        return result;
    }
}

module.exports = NotificationService;
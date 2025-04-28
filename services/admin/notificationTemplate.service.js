const ServerError = require("../../error/serverError");
const ClientError = require("../../error/clientError");
const NotificationTemplateModel = require("../../models/mysql/notificationTemplate.model");
const MediaModel = require("../../models/mysql/media.model");
const { isEmptyField } = require("../../utils/common");
const { getUrlFromBucket } = require("../../utils/s3")

class NotificationTemplateService {

    static async addNotificationTemplate(data) {
        const { keyword, title, image_id, message, other_details = {}, user } = data;

        const [media] = await MediaModel.getOneByuId(image_id);
        if (!media) {
            throw new ClientError("Invalid image id");
        }

        const [existingNotificationTemplate] = await NotificationTemplateModel.findOneByKeyword(keyword);
        if (existingNotificationTemplate) {
            throw new ClientError("Given keyword is already in use.");
        }

        if (isEmptyField(message) && Object.keys(other_details).length < 1) {
            throw new ClientError("Both message and other details cannot be empty");
        }

        const notificationTemplateobj = {
            keyword,
            title,
            message,
            image_id: media.id,
            other_details
        }

        const { rows } = await NotificationTemplateModel.insert(notificationTemplateobj);

        if (rows < 1) {
            throw new ServerError("Something went wrong.")
        }

        return {
            msg: 'Notification Template created successfully'
        }
    }

    static async updateNotificationTemplate(data) {
        const { template_id, title, image_id, message, other_details = {}, user } = data;

        const [existingNotificationTemplate] = await NotificationTemplateModel.findOneByuId(template_id);
        if (!existingNotificationTemplate) {
            throw new ClientError("Invalid template id");
        }

        const notificationTemplateobj = {}

        if (isEmptyField(message) && Object.keys(other_details).length < 1) {
            throw new ClientError("Both message and other details cannot be empty");
        }

        if (!isEmptyField(title)) {
            notificationTemplateobj['title'] = title;
        }

        if (!isEmptyField(image_id)) {
            const [media] = await MediaModel.getOneByuId(image_id);
            if (!media) {
                throw new ClientError("Invalid image id");
            }

            notificationTemplateobj['image_id'] = media.id;
        }

        if (!isEmptyField(message)) {
            notificationTemplateobj['message'] = message;
            notificationTemplateobj['other_details'] = other_details;
        }

        if (!isEmptyField(other_details)) {
            notificationTemplateobj['other_details'] = other_details;
            notificationTemplateobj['message'] = message;
        }

        const { rows } = await NotificationTemplateModel.updateOneById(notificationTemplateobj, existingNotificationTemplate.id);

        if (rows < 1) {
            throw new ServerError("Something went wrong.")
        }

        return {
            msg: 'Notification Template created successfully'
        }
    }

    static async notificationTemplateList(data) {
        const {
            page = 1,
            page_size = 10,
            sort_by = 'nt.id',
            is_paginated = true,
            order = 'desc',
            search_key
        } = data;

        const sort = `${sort_by} ${order}`;
        const limit = Number(page_size);
        const offset = (Number(page) - 1) * Number(page_size);

        const response = await NotificationTemplateModel.listNotificationTemplate({ sort, offset, limit, is_paginated, search_key });

        return {
            count: response.count,
            rows: response.rows?.map(each => ({
                ...each,
                image: getUrlFromBucket(each.image, false)
            }))
        }

    }

    static async getNotificationDetailsByKeyword(keyword, dbTransaction) {
        if (!keyword) {
            throw new ServerError(`Notification Keyword is ${keyword}`);
        }

        const [existingNotificationTemplate] = await NotificationTemplateModel.findOneByKeyword(keyword, dbTransaction);
        if (!existingNotificationTemplate) {
            throw new ServerError('Notification Keyword not found');
        }

        const notificationTemplate = {
            title: existingNotificationTemplate?.title || '',
            message: existingNotificationTemplate?.message || existingNotificationTemplate?.other_details?.message || '',
            image: getUrlFromBucket(existingNotificationTemplate?.image),
            other_details: existingNotificationTemplate?.other_details,
            existingNotificationTemplate
        }

        return notificationTemplate;
    }
}

module.exports = NotificationTemplateService;
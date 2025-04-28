const { NotificationDeviceType, NotificationTopicType } = require("../../constants/database");
const { NotificationActionType } = require("../../constants/notification");

const sendNotification = {
    body: {
        type: 'object',
        properties: {
            topic: { type: 'string', enum: Object.keys(NotificationTopicType).map(elem => NotificationTopicType[elem]['topic']) },
            title: { type: 'string' },
            device_type: { type: 'integer', enum: Object.values(NotificationDeviceType) },
            type: { type: 'integer', enum: Object.keys(NotificationTopicType).map(elem => NotificationTopicType[elem]['type']) },
            image: { type: 'string', minLength: 2 },
            message: { type: 'string' },
            html_description: { type: 'string' },
            description: { type: 'string' },
            action_url: { type: 'string' },
            action_type: { type: 'string',  enum: [...Object.keys(NotificationActionType), ""] },
            action_button_name: { type: 'string' },
        },
        required: ['title', 'topic', 'message'],
    }
}

const getNotificationList = {
    query: {
        type: 'object',
        properties: {
            page: { type: 'string' },
            page_size: { type: 'string' },
            is_paginated: { type: 'string' },
        },
        required: [],
    }
}

module.exports = {
    sendNotification,
    getNotificationList
}
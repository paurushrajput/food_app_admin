const createNotificationTemplate = {
    body: {
        type: 'object',
        properties: {
            keyword: { type: 'string', minLength: 3 },
            title: { type: 'string', minLength: 3 },
            image_id: { type: 'string', minLength: 3 },
            message: { type: 'string' },
            other_details: { type: 'object' },
        },
        required: ['keyword', 'title', 'image_id'],
    }
}

const updateNotificationTemplate = {
    body: {
        type: 'object',
        properties: {
            template_id: { type: 'string' },
            title: { type: 'string' },
            image_id: { type: 'string' },
            message: { type: 'string' },
            other_details: { type: 'object' },
        },
        required: ['template_id'],
    }
}

const notificationTemplateList = {
    query: {
        type: 'object',
        properties: {
            page: { type: 'string' },
            page_size: { type: 'string' },
            is_paginated: { type: 'string' },
            search_Key: { type: 'string' }
        },
        required: [],
    }
}


module.exports = {
    createNotificationTemplate,
    updateNotificationTemplate,
    notificationTemplateList,
}
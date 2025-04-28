
const insertAppSettings = {
    body: {
        type: 'object',
        properties: {
            title: { type: 'string', minLength: 1, maxLength: 100 },
            image: { type: 'string', minLength: 1, maxLength: 100 },
            description: { type: 'string', minLength: 1, maxLength: 1000 },
            url: { type: 'string', minLength: 1, maxLength: 500 },
        },
        required: ['title'],
    }
}

const updateAppSettings = {
    body: {
        type: 'object',
        properties: {
            settings_id: { type: 'string', minLength: 1, maxLength: 100 },
            title: { type: 'string', minLength: 1, maxLength: 100 },
            image: { type: 'string', minLength: 1, maxLength: 100 },
            description: { type: 'string', minLength: 1, maxLength: 1000 },
            url: { type: 'string', minLength: 1, maxLength: 500 },
        },
        required: ['settings_id'],
    }
}

const updateAppSettingsBulk = {
    body: {
        type: 'object',
        properties: {
            app_settings: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', minLength: 1, maxLength: 100 },
                        title: { type: 'string', minLength: 1, maxLength: 100 },
                        image: { type: 'string', minLength: 1, maxLength: 100 },
                        description: { type: 'string', minLength: 1, maxLength: 1000 },
                        url: { type: 'string', minLength: 1, maxLength: 500 },
                        sequence: { type: 'number' },
                    },
                    required: ['id', 'sequence'],
                }
            },
        },
        required: ['app_settings'],
    }
}

const deleteAppSettings = {
    body: {
        type: 'object',
        properties: {
            settings_id: { type: 'string', minLength: 1, maxLength: 100 },
        },
        required: ['settings_id'],
    }
}

const appSettingsAndFilter = {
    query: {
        type: 'object',
        properties: {
            // page: { type: 'string' },
            // page_size: { type: 'string' },
            // is_paginated: { type: 'string' },
            // sort_by: { type: 'string' },
            // order: { type: 'string' },
            title: { type: 'string', minLength: 1, maxLength: 100 },
        },
        required: [],
    }
}

module.exports = {
    insertAppSettings,
    updateAppSettings,
    updateAppSettingsBulk,
    deleteAppSettings,
    appSettingsAndFilter
};
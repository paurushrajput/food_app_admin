const { Status, Bit } = require("../../constants/database");

const getFeedsSchema = {
    query: {
        type: 'object',
        properties: {
            page: { type: 'string' },
            page_size: { type: 'string' },
            is_paginated: { type: 'string' },
            type: { type: 'string' },
        },
        required: [],
    }
}

const updateFeedSchema = {
    body: {
        type: 'object',
        properties: {
            feed_id: { type: 'string' },
            status: { type: 'integer', enum:Object.values(Status) },
        },
        required: ['feed_id','status'],
    }
}

const feedDetailsSchema = {
    query: {
        type: 'object',
        properties: {
            feed_id: { type: 'string' },
        },
        required: ['feed_id'],
    }
}

module.exports = {
    getFeedsSchema,
    updateFeedSchema,
    feedDetailsSchema
}
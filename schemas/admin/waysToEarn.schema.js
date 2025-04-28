const { BannerType, BannerSize, BANNER_SCREEN_TYPE } = require("../../constants/banner");
const { Status, Bit } = require("../../constants/database");

const waysToEarnlist = {
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

const createWaysToEarn = {
    body: {
        type: 'object',
        properties: {
            type: { type: 'string', enum: Object.keys(BannerType) },
            action: { type: 'string' },
            title: { type: 'string' },
            coins: { type: 'integer' },
            coin_currency: { type: 'string' },
            icon: { type: 'string' },
            button_name: { type: 'string' },
            status: { type: 'integer' },

        },
        required: ['type','action','title','coins','button_name'],
    }
}

const updateWaysToEarn = {
    body: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: Object.keys(BannerType) },
            action: { type: 'string' },
            title: { type: 'string' },
            coins: { type: 'integer' },
            coin_currency: { type: 'string' },
            icon: { type: 'string' },
            button_name: { type: 'string' },
            status: { type: 'integer' , enum:[Status.one,Status.zero] },

        },
        required: ['id'],
    }
}

const updateSequence = {
    body: {
        type: 'object',
        properties: {
            data: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        sequence: { type: 'integer', minimum: 1 },
                    },
                    required: ['id', 'sequence'],
                }
            }
        },
        required: ['data'],
    }
}

module.exports = {
    createWaysToEarn,
    updateWaysToEarn,
    waysToEarnlist,
    updateSequence
}
const { BannerType, BannerSize, BANNER_SCREEN_TYPE } = require("../../constants/banner");
const { Status } = require("../../constants/database");

// const createBanner = {
//     body: {
//         type: 'object',
//         properties: {
//             banner_type: { type: 'string',  maxLength: 255},
//             action: { type: 'string',  maxLength: 255},
//             banner_url: { type: 'string',  maxLength: 255},
//             app_type: { type: 'string', enum: ['free', 'pro'] },
//             banner_size: { type: 'string',  maxLength: 255},
//             action_type: { type: 'string',  enum: ['1','2','3','4','5','6','7','8','9']},
//             banner_order: { type: 'integer'},
//             campaign_id: {type: 'string'},
//             message: {type: 'string'}
//         },
//         required: ['banner_url','action_type'],
//     }
// }

const bannerList = {
    query: {
        type: 'object',
        properties: {
            page: { type: 'string' },
            page_size: { type: 'string' },
            is_paginated: { type: 'string' },
            type: { type: 'string' },
            source: { type: 'string' },
            banner_size: { type: 'string' },
            keyword: { type: 'string' }
        },
        required: [],
    }
}

// const updateBanner = {
//     params:{
//         type: "object",
//     properties: {
//        banner_uid: {type: "string"}
//     },
//     required:['banner_uid']
//     },
//     body: {
//         type: 'object',
//         properties: {
//             banner_type: { type: 'string',  maxLength: 255},
//             action: { type: 'string',  maxLength: 255},
//             banner_url: { type: 'string',  maxLength: 255},
//             app_type: { type: 'string', enum: ['free', 'pro'] },
//             banner_size: { type: 'string',  maxLength: 255},
//             action_type: { type: 'string',  enum: ['1', '2','3','4']},
//             banner_order: { type: 'integer'},
//             campaign_id: {type: 'string'},
//             message: {type: 'string'},
//         },
//         required: [],
//     }
// }

// const deleteBanner= {
//     params:{
//         type: "object",
//     properties: {
//        banner_uid: {type: "string"}
//     },
//     required:['banner_uid']
//     },
// }

const createBanner = {
    body: {
        type: 'object',
        properties: {
            banner_type: { type: 'string', enum: Object.keys(BannerType) },
            screen_type: { type: 'string', enum: Object.values(BANNER_SCREEN_TYPE) },
            banner_size: { type: 'string', enum: Object.keys(BannerSize) },
            image_id: { type: 'string', minLength: 3 },
            action: { type: 'string' },
            action_screen: { type: 'string' },
        },
        required: ['banner_type', 'screen_type', 'banner_size'],
    }
}

const updateBanner = {
    body: {
        type: 'object',
        properties: {
            id: { type: 'string', minLength: 3 },
            banner_type: { type: 'string', enum: [...Object.keys(BannerType), ''] },
            screen_type: { type: 'string', enum: Object.values(BANNER_SCREEN_TYPE) },
            banner_size: { type: 'string', enum: [...Object.keys(BannerSize), ''] },
            image_id: { type: 'string', minLength: 3 },
            action: { type: 'string' },
            action_screen: { type: 'string' },
            status: { type: 'number', enum: [...Object.values(Status), ''] },
        },
        required: ['id'],
    }
}

const deleteBanner = {
    body: {
        type: "object",
        properties: {
            id: { type: "string" }
        },
        required: ['id']
    },
}
module.exports = {
    createBanner,
    updateBanner,
    bannerList,
    deleteBanner
}
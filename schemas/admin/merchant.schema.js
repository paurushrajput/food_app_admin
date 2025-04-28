const { MerchantType, RestaurantApproval, MerchantStatus, Status, RESTAURANT_LIST_TYPE } = require("../../constants/database");

const getMerchantList = {
    query: {
        type: 'object',
        properties: {
            page: { type: 'string' },
            page_size: { type: 'string' },
            merchant_type: { type: 'string', enum: Object.values(MerchantType) },
            is_paginated: { type: 'string' },
            keyword: { type: 'string' },
            type: { type: 'string', enum: Object.values(RESTAURANT_LIST_TYPE) }
        },
        required: [],
    }
}


const getMerchantRestaurant = {
    params: {
        type: 'object',
        properties: {
            merchantId: { type: 'string' },
        },
        required: ['merchantId'],
    },
}

const getRestaurantList = {
    query: {
        type: 'object',
        properties: {
            page: { type: 'string' },
            page_size: { type: 'string' },
            restaurant_type: { type: 'string', enum: Object.values(RestaurantApproval) },
            is_paginated: { type: 'string' },
            keyword: { type: 'string' },
            loc_id: { type: 'string' },
            cat_id: { type: 'string' },
            mer_id: { type: 'string' },
            type: { type: 'string', enum: Object.values(RESTAURANT_LIST_TYPE) }
        },
        required: [],
    }
}

const getRestaurantDetails = {
    query: {
        type: 'object',
        properties: {
            restaurant_id: { type: 'string' },
        },
        required: ['restaurant_id'],
    }
}

const restaurantApproval = {
    body: {
        type: 'object',
        properties: {
            restaurant_id: { type: 'string' },
            approve: {
                type: 'integer',
                enum: [1, 0]
            },
        },
        required: ['restaurant_id', 'approve'],
    }
}

const changeMerchantStatus = {
    body: {
        type: 'object',
        properties: {
            mer_id: { type: 'string' },
            status: { type: 'string', enum: Object.keys(MerchantStatus) },
        },
        required: ['mer_id', 'status'],
    }
}

const updateMerchant = {
    body: {
        type: 'object',
        properties: {
            mer_id: { type: 'string', minLength: 3 },
            force_update_pass: { type: 'string', enum: [...Object.values(Status).map(el => el.toString()), ""] },
            email: { type: 'string' },
            country_code: { type: 'string' },
            mobile: { type: 'string' },
        },
        required: ['mer_id'],
    }
}

const getAccessToken = {
    query: {
        type: 'object',
        properties: {
            merchant_id: { type: 'string' },
        },
        required: ['merchant_id'],
    },
}

module.exports = {
    getMerchantList,
    getRestaurantList,
    restaurantApproval,
    getRestaurantDetails,
    getMerchantRestaurant,
    changeMerchantStatus,
    getAccessToken,
    updateMerchant
};
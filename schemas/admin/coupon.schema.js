const { CouponDiscountType, CouponType, CouponStatus } = require("../../constants/database");

const addCoupon = {
    body: {
        type: 'object',
        properties: {
            uses_per_user: { type: 'integer', minimum: 1 },
            user_id: { type: 'string' },
            organization_id: { type: 'string' },
            coupon_code: { type: 'string' },
            discount: { type: 'number' },
            discount_type: { type: 'string', enum: Object.values(CouponDiscountType) },
            max_discount: { type: 'number' },
            min_use: { type: 'integer', minimum: 1 },
            max_use: { type: 'integer', minimum: 1 },
            description: { type: 'string' },
            expiration_at: { type: 'integer' },
            type: { type: 'integer', enum: Object.values(CouponType) },
            rules: { type: 'array' },
        },
        required: ['uses_per_user', 'discount', 'discount_type', 'min_use', 'max_use', 'expiration_at', 'type'],
    }
}

const updateCoupon = {
    body: {
        type: 'object',
        properties: {
            coupon_id: { type: 'string' },
            uses_per_user: { type: 'integer' },
            discount: { type: 'number' },
            discount_type: { type: 'string', enum: Object.values(CouponDiscountType) },
            max_discount: { type: 'number' },
            min_use: { type: 'integer' },
            max_use: { type: 'integer' },
            description: { type: 'string' },
            expiration_at: { type: 'integer' },
            type: { type: 'integer', enum: Object.values(CouponType) },
            rules: { type: 'array' },
        },
        required: ['coupon_id'],
    }
}


const getAndFilterCouponList = {
    query: {
        type: 'object',
        properties: {
            page: { type: 'string' },
            page_size: { type: 'string' },
            is_paginated: { type: 'string' },
            organization_id: { type: 'string' },
            uses_per_user: { type: 'string' },
            discount: { type: 'number' },
            discount_type: { type: 'string', enum: Object.values(CouponDiscountType) },
            type: { type: 'number', enum: Object.values(CouponType) },
            status: { type: 'number', enum: Object.values(CouponStatus) },
        },
        required: [],
    }
}

const deleteCoupon = {
    query: {
        type: 'object',
        properties: {
            coupon_id: { type: 'string' },
        },
        required: ['coupon_id'],
    }
}

module.exports = {
    addCoupon,
    updateCoupon,
    getAndFilterCouponList,
    deleteCoupon
};
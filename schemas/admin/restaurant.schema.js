const { RestaurantStatus, Currency, CurrencyType, Bit, RESTAURANT_PAX_COMMISSION_TYPE, RESTAURANT_PAX_DETAILS, RESERVATION_TYPE, RESTAURANT_TYPE, RESERVATION_MESSAGE_TEMPLATE, SLOT_TEMPLATE } = require("../../constants/database");


const changeRestaurantStatus = {
    body: {
        type: 'object',
        properties: {
            res_id: { type: 'string' },
            status: { type: 'string', enum: Object.keys(RestaurantStatus) },
        },
        required: ['res_id', 'status'],
    }
}

const autoBookingStatus = {
    body: {
        type: 'object',
        properties: {
            res_id: { type: 'string' },
            auto_booking: { type: 'integer', enum: [1, 0] }
        },
        required: ['auto_booking'],
    }
}

const updateInfo = {
    body: {
        type: 'object',
        properties: {
            res_id: { type: 'string', minLength: 3 },
            commission_base_price: { type: 'integer' },
            commission_currency: { type: 'string', enum: [...Object.values(Currency), ""] },
            commission_type: { type: 'string', enum: [...Object.values(CurrencyType), ""] },
            // commission_settled: { type: 'number' },
            approve: { type: 'integer', enum: [...Object.values(Bit), ""] },
            restaurant_type: { type: 'integer', enum: Object.values(RESTAURANT_TYPE) },
            auto_booking: { type: 'integer', enum: [...Object.values(Bit), ""] },
            status: { type: 'string', enum: [...Object.keys(RestaurantStatus), ""] },
            pax_commission_type: { type: 'integer', enum: [...Object.values(RESTAURANT_PAX_COMMISSION_TYPE)] },
            pax_details: {
                type: 'object', properties: {
                    fixed_per_pax: {
                        type: 'integer',
                        // minimum: RESTAURANT_PAX_DETAILS.fixed_per_pax[0],
                        // maximum: RESTAURANT_PAX_DETAILS.fixed_per_pax[RESTAURANT_PAX_DETAILS.fixed_per_pax.length - 1],
                    },
                    varies_per_pax: { type: 'array' },
                    fixed_per_booking: {
                        type: 'integer',
                        minimum: RESTAURANT_PAX_DETAILS.fixed_per_booking[0],
                        maximum: RESTAURANT_PAX_DETAILS.fixed_per_booking[RESTAURANT_PAX_DETAILS.fixed_per_booking.length - 1],
                    }
                }
            },
            on_boarded_by: { type: 'integer' },
            approved_by: { type: 'integer' },
            live_by: { type: 'integer' },
            enable_instant_payment: { type: 'integer', enum: [Bit.one, Bit.zero] },
            instant_pay_amt_pct: { type: 'integer' },
            pilot_by: { type: 'integer' },
            rev_msg_template: { type: 'integer', enum: [...Object.values(RESERVATION_MESSAGE_TEMPLATE), ""] },
            voucher_applicable: { type: 'integer', enum: [Bit.one, Bit.zero] },
            credits_applicable: { type: 'integer', enum: [Bit.one, Bit.zero] },

        },
        required: ['res_id'],
    }
}

const getReviewDetails = {
    query: {
        type: 'object',
        properties: {
            res_id: { type: 'string', minLength: 3 }
        },
        required: ['res_id'],
    }
}

const getSlots = {
    query: {
        type: 'object',
        properties: {
            page: { type: 'number' },
            page_size: { type: 'number' },
            is_paginated: { type: 'string' },
            sort_by: { type: 'string' },
            order: { type: 'string' },
            keyword: { type: 'string' },
            from_date: { type: 'string' },
            to_date: { type: 'string' },
            res_id: { type: 'string' },
            day: { type: 'number' },
            month: { type: 'number' },
            year: { type: 'number' },
        },
        required: ['res_id'],
    },
}

const getRestaurantByMerchant = {
    query: {
        type: 'object',
        properties: {
            merchant_id: { type: 'string', minLength: 3 }
        },
        required: ['merchant_id'],
    }
}

const updateSlots = {
    body: {
        type: 'object',
        properties: {
            restaurant_id: { type: 'string' },
            slots: {
                type: 'array',
                minItems: 1,
                items: {
                    type: 'object',
                    properties: {
                        start_date: { type: 'string' },
                        end_date: { type: 'string' },
                        start_time: { type: 'string' },
                        end_time: { type: 'string' },
                        otp_required: { type: 'integer', enum: [Bit.one, Bit.zero] },
                        rev_msg_template: { type: 'integer', enum: Object.values(SLOT_TEMPLATE) },
                        max_guest_per_booking: { type: 'integer', minimum: 1 },
                        discount: { type: 'integer', minimum: 1 },
                        voucher_applicable: { type: 'integer', enum: [Bit.one, Bit.zero] },
                        booking_fee_required: { type: 'integer', enum: [Bit.one, Bit.zero] },
                        auto_booking: { type: 'integer', enum: [Bit.one, Bit.zero] },
                        amount: { type: 'number' },
                        total_capacity: { type: 'integer', minimum: 1 },
                    },
                    required: ['start_date', 'end_date', 'start_time', 'end_time'],
                }
            },
        },
        required: ['restaurant_id', 'slots'],
    },
}

module.exports = {
    changeRestaurantStatus,
    autoBookingStatus,
    updateInfo,
    getReviewDetails,
    getSlots,
    getRestaurantByMerchant,
    updateSlots
};
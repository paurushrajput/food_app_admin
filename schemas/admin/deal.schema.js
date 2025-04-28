const { Bit, DEAL_TYPE, SLOT_TEMPLATE, DEAL_COMMISSION_TYPE, RestaurantOperationalFullDay, DEAL_TEMPLATE } = require("../../constants/database")
const { PaymentStatus, OrderStatusCode } = require("../../constants/payments")

const dealList = {
    query: {
        type: 'object',
        properties: {
            page: { type: 'string' },
            page_size: { type: 'string' },
            is_paginated: { type: 'string' },
            from_date: { type: 'string' },
            to_date: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            restaurant_id: { type: 'string' },
            category_id: { type: 'string' },
            days_validity: { type: 'string' },
            days_validity: { type: 'string' },
            sold_out: { type: 'string', enum: [Bit.one, Bit.zero] },
        },
        required: [],
    }
}

const createDeal = {
    body: {
        type: 'object',
        properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            images: { type: 'array' },
            start_time: { type: 'string' },
            end_time: { type: 'string' },
            restaurant_id: { type: 'string' },
            deal_categories: { type: 'array' },
            deal_conditions: { type: 'string' },
            deal_highlights: { type: 'string' },
            permitted_restaurant_ids: { type: 'array', },
            days_validity: { type: ['integer', 'null'], minimum: 1, nullable: true },
            is_pilot: { type: 'integer', enum: [Bit.one, Bit.zero] },
            type: { type: 'string', enum: Object.values(DEAL_TYPE) },
            is_locked: { type: 'integer', enum: [Bit.one, Bit.zero] },
            lock_conditions: {
                type: 'object',
                properties: {
                    referral: { type: 'integer' },
                    referral_mobile_verified: { type: 'integer', enum: [Bit.one, Bit.zero] },
                    booking: {
                        type: 'object',
                        properties: {
                            restaurant_id: { type: 'string' },
                            count: { type: 'integer', },
                            booking_fee_required: { type: 'integer', enum: [Bit.one, Bit.zero] },
                            template: { type: 'integer', enum: Object.values(SLOT_TEMPLATE) }
                        },
                        required: ['count', 'booking_fee_required', 'template']
                    },
                    instant_pay: { type: 'integer' },
                },
                required: ['referral', 'referral_mobile_verified']
            },
            device_check: { type: 'integer', enum: [Bit.one, Bit.zero] },
            deal_option: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        actual_price: { type: 'string' },
                        discounted_price: { type: 'number' },
                        max_use: { type: 'number' },
                        uses_per_user: { type: 'integer', minimum: 1, maximum: 7 },
                        show_on_home_page: { type: 'integer', enum: [Bit.one, Bit.zero] },
                        max_qty_pr_purchase: { type: 'integer', nullable: true, minimum: 1 },
                        pax_comission_type: { type: 'integer', nullable: true, enum: Object.values(DEAL_COMMISSION_TYPE) },
                        pax_details: {
                            type: 'object',
                            properties: {
                                fixed_per_pax: { type: 'number', minimum: 1 },
                                varies_per_pax: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            amount: { type: 'number', minimum: 1 },
                                            num_person: { type: 'integer', minimum: 1 },
                                        },
                                        required: ['amount', 'num_person']
                                    },
                                    minItems: 1,
                                },
                                fixed_per_booking: { type: 'number', minimum: 1 },
                            }
                        },
                    },
                    required: ['title', 'actual_price', 'discounted_price', 'max_use', 'show_on_home_page', 'uses_per_user'],
                }
            },
            template: { type: 'integer', nullable: true, enum: Object.values(DEAL_TEMPLATE) },
            slots: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        interval_in_mins: { type: 'integer', nullable: true },
                        start_at: { type: 'string', nullable: true },
                        end_at: { type: 'string', nullable: true },
                    },
                    minItems: 1,
                }
            },
            days: {
                type: 'array',
                maxItems: 7,
                items: { type: 'string', enum: Object.values(RestaurantOperationalFullDay) }
            },
            exclude_dates: {
                type: 'array',
                items: { type: 'string'} //YYYY-MM-DD
            },
            pre_select_branch:{ type: 'integer', enum: [Bit.one, Bit.zero] },
            free_with_nukhba_credits : { type:'integer', enum: [Bit.one, Bit.zero] }
        },
        required: ['title', 'description', 'images', 'end_time', 'restaurant_id', 'deal_categories', 'deal_option', 'type', 'deal_conditions', 'deal_highlights',],
    }
}

const updateDeal = {
    body: {
        type: 'object',
        properties: {
            deal_id: { type: 'string' },
            title: { type: 'string', },
            description: { type: 'string', },
            images: { type: 'array' },
            start_time: { type: 'string' },
            end_time: { type: 'string' },
            restaurant_id: { type: 'string' },
            deal_categories: { type: 'array' },
            days_validity: { type: ['integer', 'null'], minimum: 1, nullable: true },
            deal_conditions: { type: 'string' },
            deal_highlights: { type: 'string' },
            permitted_restaurant_ids: { type: 'array', },
            status: { type: 'integer', enum: [Bit.one, Bit.zero] },
            type: { type: 'string', enum: Object.values(DEAL_TYPE) },
            is_pilot: { type: 'integer', enum: [Bit.one, Bit.zero] },
            sold_out: { type: 'integer', enum: [Bit.one, Bit.zero] },
            is_locked: { type: 'integer', enum: [Bit.one, Bit.zero] },
            lock_conditions: {
                type: 'object',
                properties: {
                    referral: { type: 'integer' },
                    referral_mobile_verified: { type: 'integer', enum: [Bit.one, Bit.zero] },
                    booking: {
                        type: 'object',
                        properties: {
                            restaurant_id: { type: 'string' },
                            count: { type: 'integer', },
                            booking_fee_required: { type: 'integer', enum: [Bit.one, Bit.zero] },
                            template: { type: 'integer', enum: Object.values(SLOT_TEMPLATE) }
                        },
                        required: ['count', 'booking_fee_required', 'template']
                    },
                    instant_pay: { type: 'integer' },
                },
                required: ['referral', 'referral_mobile_verified']
            },
            device_check: { type: 'integer', enum: [Bit.one, Bit.zero] },
            deal_option: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        deal_option_id: { type: 'string' },
                        title: { type: 'string' },
                        actual_price: { type: 'string' },
                        discounted_price: { type: 'number' },
                        max_use: { type: 'number' },
                        uses_per_user: { type: 'integer', minimum: 1, maximum: 7 },
                        show_on_home_page: { type: 'integer', enum: [Bit.one, Bit.zero] },
                        max_qty_pr_purchase: { type: 'integer', nullable: true, minimum: 1 },
                        pax_comission_type: { type: 'integer', nullable: true, enum: Object.values(DEAL_COMMISSION_TYPE) },
                        pax_details: {
                            type: 'object',
                            properties: {
                                fixed_per_pax: { type: 'number', minimum: 1 },
                                varies_per_pax: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            amount: { type: 'number', minimum: 1 },
                                            num_person: { type: 'integer', minimum: 1 },
                                        },
                                        required: ['amount', 'num_person']
                                    },
                                    minItems: 1,
                                },
                                fixed_per_booking: { type: 'number', minimum: 1 },
                            }
                        },
                    },
                    // required: ['title', 'actual_price', 'discounted_price', 'max_use', 'show_on_home_page', 'deal_option_id', 'uses_per_user'],
                }
            },
            template: { type: 'integer', nullable: true, minimum: 0 },
            slots: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        interval_in_mins: { type: 'integer', nullable: true },
                        start_at: { type: 'string' },
                        end_at: { type: 'string' },
                    },
                    minItems: 1,
                    required: ['interval_in_mins', 'start_at', 'end_at']
                }
            },
            days: {
                type: 'array',
                maxItems: 7,
                items: { type: 'string', enum: Object.values(RestaurantOperationalFullDay) }
            },
            exclude_dates: {
                type: 'array',
                items: { type: 'string'} //YYYY-MM-DD
            },
            pre_select_branch:{ type: 'integer', enum: [Bit.one, Bit.zero] },
            free_with_nukhba_credits : { type:'integer', enum: [Bit.one, Bit.zero] }
        },
        required: ['deal_id'],
    }
}

const deleteDeal = {
    body: {
        type: "object",
        properties: {
            deal_id: { type: "string" }
        },
        required: ['deal_id']
    },
}

const dealOptionList = {
    query: {
        type: 'object',
        properties: {
            page: { type: 'string' },
            page_size: { type: 'string' },
            is_paginated: { type: 'string' },
            title: { type: 'string' },
            actual_price: { type: 'string' },
            discounted_price: { type: 'string' },
            max_use: { type: 'string' },
            deal_id: { type: 'string' }
        },
        required: ['deal_id'],
    }
}

const deleteDealOption = {
    body: {
        type: "object",
        properties: {
            deal_option_id: { type: "string" }
        },
        required: ['deal_option_id']
    },
}

const userDealList = {
    query: {
        type: 'object',
        properties: {
            page: { type: 'string' },
            page_size: { type: 'string' },
            is_paginated: { type: 'string' },
            quantity: { type: 'string' },
            user_id: { type: 'string' },
            username: { type: 'string' },
            payment_status: { type: 'string', enum: Object.values(PaymentStatus)?.map(elem => String(elem.value)) },
            deal_option_id: { type: 'string' },
            deal_id: { type: 'string' },
            is_pilot: { type: 'string', enum: [Bit.one, Bit.zero].map(String) },
            from_date: { type: 'string' },
            to_date: { type: 'string' },
            user_email: { type: 'string' },
            user_mobile: { type: 'string' },
            restaurant_id: { type: 'string' },
            restaurant_branch_id: { type: 'string' },
            booking_id: { type: 'string' },
            order_status_code: { type: 'integer', enum: [...Object.values(OrderStatusCode),PaymentStatus.clickedBack.value] }
        },
        required: [],
    }
}

const removeImage = {
    body: {
        type: "object",
        properties: {
            deal_id: { type: "string", minLength: 3 },
            deal_image_ids: { type: "array", items: { type: 'number' } }
        },
        required: ['deal_id', 'deal_image_ids']
    },
}

const updateDealSequence = {
    body: {
        type: 'object',
        properties: {
            deals: {
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
        required: ['deals'],
    }
}

module.exports = {
    createDeal,
    updateDeal,
    dealList,
    deleteDeal,
    dealOptionList,
    deleteDealOption,
    userDealList,
    removeImage,
    updateDealSequence
}
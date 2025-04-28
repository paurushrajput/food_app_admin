const { Bit, PAYMENT_TYPE } = require("../../constants/database");
const { PaymentModes, PaymentStatus, OrderStatusCode } = require("../../constants/payments");

const paymentListAndFilter = {
    query: {
        type: 'object',
        properties: {
            page: { type: 'string' },
            page_size: { type: 'string' },
            is_paginated: { type: 'string' },
            restaurant_name: { type: 'string' },
            email: { type: 'string' },
            reservation_id: { type: 'string' },
            booking_date_start: { type: 'string' },
            to_date: { type: 'string' },
            slot_time: { type: 'string' },
            payment_from_date: { type: 'string' },
            payment_to_date: { type: 'string' },
            payment_status: { type: 'integer', enum: [...Object.values(PaymentStatus)?.map(status => status.value)] },
            payment_mode: { type: 'integer', enum: [...Object.values(PaymentModes)] },
            is_nukhba_user: { type: 'integer', enum: [Bit.one, Bit.zero] },
            is_pilot: { type: 'integer', enum: [Bit.one, Bit.zero] },
            payment_type: { type: 'integer', enum: Object.values(PAYMENT_TYPE) },
            order_status_code: { type:'integer', enum: [...Object.values(OrderStatusCode),PaymentStatus.clickedBack.value] }
        },
        required: [],
    }
}

module.exports = {
    paymentListAndFilter
}
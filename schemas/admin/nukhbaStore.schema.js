const { CouponDiscountType, CouponType, CouponStatus } = require("../../constants/database");

const addNukhbaStore = {
    body: {
        type: 'object',
        properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'integer' },
            coupon_id: { type: 'string' },
            image_id: { type: 'string' },
            points: { type: 'integer' },
            status: { type: 'integer' },
        },
        required: ['title', 'description', 'type', 'image_id', 'points', 'status'],
    }
}

module.exports = {
    addNukhbaStore,

};
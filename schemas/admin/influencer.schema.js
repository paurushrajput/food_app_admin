const { UserStatus, Status, IS_NUKHBA_USER, BOOKING_COUNT_ENUM, Bit, InviteStatus, COMMISSION_TYPE } = require("../../constants/database");

const getInfluencerList = {
    query: {
        type: 'object',
        properties: {
            page: { type: 'string' },
            page_size: { type: 'string' },
            total_signedup_user: { type: 'number' },
            user_type: {
                type: 'integer',
                enum: [1, 0]
            },
            search: { type: 'string' },
            status: { type: 'string', enum: [...Object.values(UserStatus).map(el => el.toString()), ""] },
            is_nukhba_user: {
                type: 'integer',
                enum: [...Object.values(IS_NUKHBA_USER)]
            },
            booking_count: {
                type: 'integer',
                enum: [...BOOKING_COUNT_ENUM]
            },
            referred_by: { type: 'string' },
            device_id: { type: 'string' },
            allow_referral: { type: 'string', enum: [...Object.values([Bit.one, Bit.zero]).map(el => el.toString()), ""] },
            allow_campaign: { type: 'string', enum: [...Object.values([Bit.one, Bit.zero]).map(el => el.toString()), ""] },
        },
        required: [],
    }
}

const approveInfluencer = {
    body: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            approved: { type: 'number', enum: [Bit.zero,Bit.one] },
            remark:{ type:'string' },
            // commission_type:{ type:'string', enum: [Object.values(COMMISSION_TYPE)] },
            // commission:{ type:'number' , minimum: 0 },
        },
        required: ['id','approved']
    }
}

const updateInfluencer = {
    body: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            commission_type:{ type:'string', enum: Object.values(COMMISSION_TYPE) },
            commission:{ type:'number' , minimum: 0 }
        },
        required: ['id']
    }
}

module.exports = {
    getInfluencerList,
    approveInfluencer,
    updateInfluencer
};
const { UserStatus, Status, IS_NUKHBA_USER, BOOKING_COUNT_ENUM, Bit, InviteStatus, WP_MSG_DELIVERED_STATUS } = require("../../constants/database");

const getUserList = {
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

const changeUserStatus = {
    body: {
        type: 'object',
        properties: {
            user_id: { type: 'string' },
            status: { type: 'string', enum: Object.keys(UserStatus) },
        },
        required: ['user_id', 'status'],
    }
}

const addUserTicket = {
    body: {
        type: 'object',
        properties: {
            email: { type: 'string', minLength: 3 },
            limit: { type: 'number' },
        },
        required: ['email', 'limit'],
    }
}

const updateNukhbaSchema = {
    body: {
        type: 'object',
        properties: {
            user_emails: { type: 'string', minLength: 10 },
            status: { type: 'number', enum: Object.values(Status) },
        },
        required: ['user_emails', 'status'],
    }
}

const getUnusedCouponUserList = {
    query: {
        type: 'object',
        properties: {
            page: { type: 'string' },
            page_size: { type: 'string' },
            user_type: {
                type: 'integer',
                enum: [1, 0]
            },
            keyword: { type: 'string' },
            status: { type: 'string', enum: [...Object.values(UserStatus).map(el => el.toString()), ""] },
            is_nukhba_user: {
                type: 'integer',
                enum: [...Object.values(IS_NUKHBA_USER)]
            },
            coupon_id: { type: 'string', minLength: 3 },
            campaign_id: { type: 'string', minLength: 3 }
        },
        required: [],
    }
}

const sendNotification = {
    body: {
        type: 'object',
        properties: {
            user_ids: { type: 'array' },
            title: { type: 'string' },
            message: { type: 'string' },
            icon: { type: 'string' },
            coupon_id: { type: 'string', minLength: 3 },
            campaign_id: { type: 'string', minLength: 3 }
        },
        required: ['title', 'message'],
    }
}

const getAdminUserList = {
    query: {
        type: 'object',
        properties: {
            page: { type: 'string' },
            page_size: { type: 'string' },
            keyword: { type: 'string' },
        },
        required: [],
    }
}

const getUserCount = {
    body: {
        type: 'object',
        properties: {
            country_code: { type: 'string', minLength: 1 },
            mobile: { type: 'string', minLength: 1 },
        },
        required: ['country_code', 'mobile'],
    }
}

const updateUserInvite = {
    body: {
        type: 'object',
        properties: {
            user_invite_id: { type: 'string', minLength: 3 },
            status: { type: 'number', nullable: true, enum: Object.values(WP_MSG_DELIVERED_STATUS) },
        },
        required: ['user_invite_id', 'status'],
    }
}

const getIpInfo = {
    query: {
        type: 'object',
        properties: {
            ip: { type: 'string' },
        },
        required: ['ip'],
    }
}

module.exports = {
    getUserList,
    changeUserStatus,
    addUserTicket,
    updateNukhbaSchema,
    getUnusedCouponUserList,
    sendNotification,
    getAdminUserList,
    getUserCount,
    updateUserInvite,
    getIpInfo
};
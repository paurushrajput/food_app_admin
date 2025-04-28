const adminLogin = {
    body: {
        type: 'object',
        properties: {
            email: { type: 'string' },
            password: { type: 'string' },
        },
        required: ['email', 'password'],
    },
}


const adminCreate = {
    body: {
        type: 'object',
        properties: {
            email: { type: 'string' },
            password: { type: 'string' },
            role_id: { type: 'string' },
        },
        required: ['email', 'password', 'role_id'],
    },
}

const adminUpdate = {
    body: {
        type: 'object',
        properties: {
            email: { type: 'string' },
            password: { type: 'string' },
            name: { type: 'string' },
            role_id: { type: 'string' },
            id: { type: 'string' },
        },
        required: ['id'],
    },
}

const addContactInfo = {
    body: {
        type: 'object',
        properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            country_code: { type: 'string' },
            mobile: { type: 'string' }
        },
        required: ['name', 'email', 'country_code', 'mobile'],
    },
}

module.exports = {
    adminCreate,
    adminLogin,
    addContactInfo,
    adminUpdate
}
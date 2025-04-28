const { UserStatus, Status, IS_NUKHBA_USER, BOOKING_COUNT_ENUM } = require("../../constants/database");

const addAgentSchema = {
    body: {
        type: 'object',
        properties: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            password: { type: 'string' },
            email: { type: 'string',minLength:10 },
            mobile: { type: 'string',minLength:5 },
            agent_username: { type: 'string',minLength:5 },
            location_id: { type: 'string' },
            keyword: { type: 'string' },

        },
        required: ['password','first_name','last_name','location_id','agent_username'],
    },
}

const listAgentSchema = {
    query: {
        type: 'object',
        properties: {
            
        },
        required: [],
    },
}

module.exports = {
    addAgentSchema,
    listAgentSchema
};
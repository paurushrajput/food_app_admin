const { Status, Bit } = require("../../constants/database");

const getLikesSchema = {
    query: {
        type: 'object',
        properties: {
            feed_id: { type: 'string' },
            post_type: { type: 'integer'},
        },
        required: ['feed_id', 'post_type'],
    }
}

module.exports = {
    getLikesSchema,
}
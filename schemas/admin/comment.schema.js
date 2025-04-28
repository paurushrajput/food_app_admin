const { Status, Bit } = require("../../constants/database");

const getCommentSchema = {
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
    getCommentSchema,
}
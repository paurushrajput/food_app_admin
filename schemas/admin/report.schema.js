const getCampaignReport = {
    query: {
        type: 'object',
        properties: {
            campaign_code: { type: 'string' },
            from_date: { type: 'string' },
            to_date: { type: 'string' },
        },
        required: ['campaign_code'],
    }
}

const getAgentReport = {
    query: {
        type: 'object',
        properties: {
            referral_code: { type: 'string' },
        },
        required: ['referral_code'],
    }
}

module.exports = {
    getCampaignReport,
    getAgentReport
};
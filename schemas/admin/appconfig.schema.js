const createConfig = {
    body: {
        type: 'object',
        properties: {
            value: { type: 'object' },
            title: { type: 'string' }
        },
        required: []
    }
}
const updateConfig = {
    params: {
        type: 'object',
        properties: {
            uid: { type: 'string' }
        },
        required: ['uid']
    },
    body: {
        type: 'object',
        properties: {
            value: { type: ['object', 'array'] },
            status: { type: 'string' },
            title: { type: 'string' },
            override: { type: 'boolean' },
        }
    }

}

const changeStatus = {
    query: {
        type: 'object',
        properties: {
            uid: { type: 'string' }
        },
        required: ['uid']
    },
    body: {
        type: 'object',
        properties: {
            status: { type: 'string' }
        },
        required: []
    }
}

const listConfig = {
    query: {
        type: 'object',
        properties: {
            status: { type: 'string' },
            title:  { type:'string'}
        },
        required: []
    },
}

const updateAppVersion = {
    body: {
        type: 'object',
        properties: {
            config_id: { type: 'string' },
            value: {
                properties: {
                    version: { type: 'string' }, 
                    available_version: { type: 'string' },
                    force_update: { type: 'boolean' },
                    build: { type: 'object' },
                    html_description: { type: 'array' }
                },
            },
        },
        required: ['config_id', 'value']
    }
}

module.exports = {
    createConfig,
    updateConfig,
    changeStatus,
    listConfig,
    updateAppVersion
}
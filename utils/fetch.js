const axios = require("axios");

function customizeHeaders({ token, customHeaders = {}, contentType = 'application/json' }) {
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': contentType,
        ...customHeaders
    };
    return headers;
}


async function post({ url, body, headers = {} }) {
    const result = await axios.post(url, body, {
        headers: Object.keys(headers).length > 0 ? customizeHeaders(headers) : {}
    });
    return result;
}

async function get({ url, headers = {} }) {
    const result = await axios.get(url, {
        headers: Object.keys(headers).length > 0 ? customizeHeaders(headers) : {}
    });
    return result;
}


module.exports = {
    get,
    post
}
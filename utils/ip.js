var geoip = require('geoip-lite');

async function ipInfo(ip) {
    const info = geoip.lookup(ip);
    return({
        ip,
        info
    });
}

module.exports = {
    ipInfo
}
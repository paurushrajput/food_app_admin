const ServerError = require("../error/serverError");
const {get} = require("../utils/fetch");
const { GoogleMapsGeoCodeUrl } = require("../constants/goggle");


async function getReverseGeoCode(lat, long) {
    try {
        let url = `${GoogleMapsGeoCodeUrl}?latlng=${lat}, ${long}&key=${process.env.GOOGLE_API_KEY}`
        let locationData = await get({url});
        return locationData;
    } catch (error) {
        throw new ServerError('Something went wrong in geo location api');
    }
}

module.exports = {
    getReverseGeoCode,
}
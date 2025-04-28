const { get } = require("./fetch");
const { AuthUrl } = require("../constants/goggle");
const ClientError = require("../error/clientError");

async function getSocialId(idToken) {
    try {
        const url = `${AuthUrl}?id_token=${idToken}`;
        response = await get({ url });
        return {
            socialId: response.data.sub,
            gmail: response.data.email,
            gfirst_name: response.data?.given_name,
            glast_name: response.data?.family_name,
        };
    } catch (error) {
        throw new ClientError(error.response.data.error)
    }
}

module.exports = {
    getSocialId
}

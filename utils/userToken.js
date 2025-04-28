const { getData, setData } = require("../dbConfig/redisConnect");
const ServerError = require("../error/serverError");

async function updateCompleteToken(user, token, ttl = null) {
    let timeToLive;
    if (ttl != null) {
        timeToLive = ttl;
    } else {
        if (!process.env.REDIS_TTL) {
            throw new ServerError("REDIS_TTL is not available in environment variables");
        }
        timeToLive = process.env.REDIS_TTL;
    }
    if (!user.uid) {
        throw new ServerError("uid is the expected field inside user object")
    }
    const key = user.uid;
    const value = {
        token: token,
        user: user
    }
    const result = await setData(key, value, timeToLive);
    return result;
}

async function updateVariablesInToken(user) {
    if (!user.uid) {
        throw new ServerError("uid is the expected field inside user object")
    }
    const key = user.uid;
    let existingUserData = await getData(key);

    const updatedUserData = {};
    for (const [key, value] of Object.entries(user)) {
        updatedUserData[key] = value;
    }

    const updatedUser = {
        ...existingUserData.user,
        ...updatedUserData
    }

    const result = await updateCompleteToken(updatedUser, existingUserData.token);
    return result;
}

module.exports = {
    updateCompleteToken,
    updateVariablesInToken
}
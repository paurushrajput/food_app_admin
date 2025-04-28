const jwt = require("jsonwebtoken");
const util = require("util");
const ServerError = require("../error/serverError");
const ClientError = require("../error/clientError");
const readAsync = util.promisify(jwt.verify);
const createAsync = util.promisify(jwt.sign);
const jwtSecret = process.env.JWT_SECRET;
const jwtExpiryInHours = process.env.JWT_EXPIRY_IN_HOURS;
const { invalidTokenCode } = require("../constants/statusCode");

async function readJwt(token) {
    if (!jwtSecret) {
        throw new ServerError("JWT_SECRET not found in environment variable");
    }
    try {
        const decoded = await readAsync(token, jwtSecret);
        return decoded;
    } catch (error) {
        throw new ClientError('token is expired or malformed', { statusCode: invalidTokenCode });
    }
}


async function createJwt(payload, secret = null, ttlInMin = null) {
    let secretKey;
    if (secret != null) {
        secretKey = secret;
    } else {
        if (!jwtSecret) {
            throw new ServerError("JWT_SECRET not found in environment variable");
        }
        secretKey = jwtSecret;
    }
    let expiryTime;
    if (ttlInMin != null) {
        expiryTime = `${ttlInMin}m`;
    } else {
        if (!jwtExpiryInHours) {
            throw new ServerError("JWT_EXPIRY_IN_HOURS not found in environment variable");
        }
        expiryTime = `${jwtExpiryInHours}h`;
    }
    try {
        const token = await createAsync(payload, secretKey, { expiresIn: expiryTime });
        return token;
    } catch (error) {
        throw new ServerError(error);
    }
}

module.exports = {
    readJwt,
    createJwt
}
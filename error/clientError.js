const { validationErrorCode } = require("../constants/statusCode");
const { error } = require("../constants/statusText");
class ClientError extends Error {
    constructor(msg, data) {
        super(msg || error);
        this.name = "ClientError";
        this.statusCode = data?.statusCode || validationErrorCode;
        this.data = data || null;
    }
}

module.exports = ClientError



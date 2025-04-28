const { errorCode } = require("../constants/statusCode");
const { unknownError } = require("../constants/statusText");
class DatabaseError extends Error {
    constructor(msg, data) {
        super(msg || unknownError);
        this.name = "DatabaseError";
        this.statusCode = errorCode;
        this.data = data || null;
    }
}

module.exports = DatabaseError



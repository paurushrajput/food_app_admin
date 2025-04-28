const { successCode, errorCode, validationErrorCode } = require("../constants/statusCode");
const { success, error, unknownError, successBool, errorBool } = require("../constants/statusText");
const projectConfig = require("../projectConfig.json");

class RequestHandler {
    static successHandler(request, reply, data) {
        const responseData = {
            success: successBool, msg: data?.msg || success, status_code: successCode, data: (() => {
                {
                    delete data?.msg;
                    return data
                }
            })()
        };
        if (projectConfig?.logs?.responseLog?.responseData) {
            reply.responseData = responseData;
        }
        return reply.code(successCode).send(responseData);
    }

    static errorHandler(request, reply, data, error, code) {
        const responseData = { success: errorBool, status_code: code || errorCode, msg: error.toString() || unknownError, data };
        if (projectConfig?.logs?.responseLog?.responseData) {
            reply.responseData = responseData;
        }
        return reply.code(code || errorCode).send(responseData);
    }

    static validationHandler(request, reply, data, error, code) {
        const responseData = { success: errorBool, status_code: code || validationErrorCode, msg: error.toString() || error, data };
        if (projectConfig?.logs?.responseLog?.responseData) {
            reply.responseData = responseData;
        }
        return reply.code(code || validationErrorCode).send(responseData);
    }

}

module.exports = RequestHandler;
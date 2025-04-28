const GeneralError = require("../error/generalError");
const ClientError = require("../error/clientError");
const ServerError = require("../error/serverError");
const DatabaseError = require("../error/databaseError");
const RequestHandler = require("../utils/requestHandler");
const { successCode } = require("../constants/statusCode");
const { unknownError } = require("../constants/statusText");
const { logs } = require("../constants/event");
const CustomEventEmitter = require("../utils/customEventEmitter");
const { errorLogs } = require("../projectConfig.json");


//Customizing fastify error messages.
function schemaCustomizedError(validation) {
    console.log("validation ********* ", validation)
    let msg = '';
    const keywordMapper = {
        required: 'missing',
        enum: "must be equal to either",
        minLength: "should have minimum length of",
        maxLength: "should have maximum length of",
        minimum: "should be greater than equal to",
        maximum: "should be less than equal to",
        // Add more mappings as needed
    };

    for (let v of validation) {
        const paramKey = Object.keys(v.params)[0];
        const keyword = v.keyword;

        if (paramKey === 'type') {
            const fieldName = v.instancePath.split('/').slice(-1);
            msg += `${fieldName} should be a ${v.params[paramKey]}. `;
        } else if (paramKey === 'missingProperty') {
            const fieldName = v.params[paramKey];
            msg += `${fieldName} is ${keywordMapper[keyword]}. `;
        } else if (paramKey === 'allowedValues') {
            const fieldName = v.instancePath.split('/').slice(-1);
            msg += `${fieldName} ${keywordMapper[keyword]} ${v.params[paramKey].join(" or ")}. `;
        } else if (paramKey === 'limit') {
            const fieldName = v.instancePath.split('/').slice(-1);
            msg += `${fieldName} ${keywordMapper[keyword]} ${v.params[paramKey]}. `;
        } else if (paramKey === 'comparison') {
            const fieldName = v.instancePath.split('/').slice(-1);
            msg += `${fieldName} ${keywordMapper[keyword]} ${v.params?.limit || v.params[paramKey]}. `;
        } else {
            msg += v.message + ' ';
        }
    }

    return msg.trim(); // Trim any leading or trailing whitespace
}

function errorRoutes(server) {
    server.setErrorHandler((error, request, reply) => {
        console.error(error)
        if (errorLogs.create) {
            CustomEventEmitter.emit(logs.PRINT_ERROR_LOGS, { req: request, error });
        }
        if (errorLogs.save) {
            CustomEventEmitter.emit(logs.STORE_ERROR_LOGS, { req: request, error });
        }

        // Send an error response to the client
        if (error?.hasOwnProperty("validation") && error?.hasOwnProperty("validationContext")) {
            // const msg = error.validation.map((elem => (
            //     elem.message
            // )))
            const msg = schemaCustomizedError(error.validation) || undefined;
            console.error(msg || error?.message);
            return RequestHandler.validationHandler(request, reply, null, msg || error?.message);
        }

        if (error instanceof ServerError) {
            return RequestHandler.errorHandler(request, reply, error?.data, error?.message);
        } else if (error instanceof ClientError) {
            return RequestHandler.validationHandler(request, reply, error?.data, error?.message, error?.statusCode);
        } else if (error instanceof DatabaseError) {
            return RequestHandler.validationHandler(request, reply, error?.data, unknownError);
        } else {
            //General Error
            error = new GeneralError(error.toString());
            return RequestHandler.errorHandler(request, reply, error?.data, error?.message, successCode);
        }
    });
}

module.exports = {
    errorRoutes
}
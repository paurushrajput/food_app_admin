const { beautifyRequestLogs } = require("../configuration/initialize");
const { DEFAULT_LOCAL_IP } = require("../constants/variables");
const { connection } = require("../dbConfig/dbConnect.js");
const { isEmptyField } = require("../utils/common.js");
const { subtractOneDayAndSetTime, formatDateSetTime } = require("../utils/moment.js");

const asyncRouteHandler = (fn, isDbTransaction = false) => async (request, reply, done) => {
    let dbTransaction;
    if (isDbTransaction) {
        dbTransaction = await connection().getConnection()
        await dbTransaction.beginTransaction();
    }
    request.startTime = Date.now();
    request.userInput = { ...request.body, ...request.params, ...request.query, ...request.headers, ...{ request_header: request.headers }, ...{ ip_address: request.headers?.x_forwarded_for || DEFAULT_LOCAL_IP }, ...{ user: request.user }, dbTransaction }
    const { method, url, headers, params, query, body } = request;
    request.startTime = Date.now();
    beautifyRequestLogs({
        method: JSON.stringify(method),
        url: JSON.stringify(url),
        headers: JSON.stringify(headers),
        params: JSON.stringify(params),
        query: JSON.stringify(query),
        body: JSON.stringify(body)
    });

    if (!isEmptyField(request?.userInput?.from_date)) {
        request.userInput.from_date = subtractOneDayAndSetTime(request.userInput.from_date);
    }

    if (!isEmptyField(request?.userInput?.to_date)) {
        request.userInput.to_date = formatDateSetTime(request.userInput.to_date);
    }

    if (!isEmptyField(request?.userInput?.payment_from_date)) {
        request.userInput.payment_from_date = subtractOneDayAndSetTime(request.userInput.payment_from_date);
    }

    if (!isEmptyField(request?.userInput?.payment_to_date)) {
        request.userInput.payment_to_date = formatDateSetTime(request.userInput.payment_to_date);
    }


    if (!isEmptyField(request?.userInput?.redeemed_at_from_date)) {
        request.userInput.redeemed_at_from_date = subtractOneDayAndSetTime(request.userInput.redeemed_at_from_date);
    }

    if (!isEmptyField(request?.userInput?.redeemed_at_to_date)) {
        request.userInput.redeemed_at_to_date = formatDateSetTime(request.userInput.redeemed_at_to_date);
    }

    if (!isEmptyField(request?.userInput?.created_at_from_date)) {
        request.userInput.created_at_from_date = subtractOneDayAndSetTime(request.userInput.created_at_from_date);
    }

    if (!isEmptyField(request?.userInput?.created_at_to_date)) {
        request.userInput.created_at_to_date = formatDateSetTime(request.userInput.created_at_to_date);
    }

    return Promise.resolve(fn(request, reply)).then(async (result) => {
        if (isDbTransaction && dbTransaction) {
            await dbTransaction.commit();
            console.log("TRANSACTION COMMITTED");
            dbTransaction.release();
            console.log("TRANSACTION RELEASE");
        }
    }).catch(async (err) => {
        if (isDbTransaction && dbTransaction) {
            await dbTransaction.rollback();
            console.log("TRANSACTION ROLLBACK");
            dbTransaction.release();
            console.log("TRANSACTION RELEASE");
        }
        throw err;
    });
};


// const asyncRouteHandler = (fn) => (request, reply, done) => {
//     request.startTime = Date.now();
//     request.userInput = { ...request.body, ...request.params, ...request.query, ...request.headers, ...{ request_header: request.headers }, ...{ ip_address: request.headers?.x_forwarded_for }, ...{ user: request.user } }
//     const { method, url, headers, params, query, body } = request;
//     request.startTime = Date.now();
//     beautifyRequestLogs({
//         method: JSON.stringify(method),
//         url: JSON.stringify(url),
//         headers: JSON.stringify(headers),
//         params: JSON.stringify(params),
//         query: JSON.stringify(query),
//         body: JSON.stringify(body)
//     });
//     return Promise.resolve(fn(request, reply)).catch(done);
// };

module.exports = asyncRouteHandler;
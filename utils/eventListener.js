const CustomEventEmitter = require("../utils/customEventEmitter");
const { logs } = require("../constants/event");
const { logErrorThis } = require("../logger/print");
const { addNewError } = require("../logger/logManager");

CustomEventEmitter.on(logs.PRINT_ERROR_LOGS, (data) => {
    logErrorThis(data);
});

CustomEventEmitter.on(logs.STORE_ERROR_LOGS, (data) => {
    addNewError(data);
});
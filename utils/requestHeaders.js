const { permanentVariable, optionalVariable, adminPermanentVariables } = require("../constants/requestHeader");

function verifyHeaders(headers, considerOptionalVariables = true) {
    const headersVariable = [...permanentVariable];
    if (considerOptionalVariables) {
        headersVariable.push(...optionalVariable);
    }
    const missingVariables = [];
    for (let variable of headersVariable) {
        const variableValue = headers[variable];
        if (typeof variableValue == "undefined" || variable == null) {
            missingVariables.push(variable);
        }
    }
    return missingVariables;
}

function verifyAdminHeaders(headers){
    const headersVariable = [...adminPermanentVariables];
    const missingVariables = [];
    for (let variable of headersVariable) {
        const variableValue = headers[variable];
        if (typeof variableValue == "undefined" || variable == null) {
            missingVariables.push(variable);
        }
    }
    return missingVariables;
}
module.exports = {
    verifyHeaders,
    verifyAdminHeaders
}
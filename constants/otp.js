const countryCode = {
    INDIA: "+91"
}

const otpSendEnvironment = ['production', 'beta1']

const otpDefault = 1234

const otpStatusCode = {
    success: "success",
    "200": 200,
    error: "error",
}

module.exports = {
    countryCode,
    otpStatusCode,
    otpSendEnvironment,
    otpDefault
}
const ServerError = require("../error/serverError");
const { get } = require("../utils/fetch");
const { countryCode, otpStatusCode, otpSendEnvironment, otpDefault } = require("../constants/otp");

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const twilioClient = require("twilio")(accountSid, authToken);

const SMS_API_URL_SARV = process.env.SMS_API_URL_SARV;
const SMS_TOKEN_SARV = process.env.SMS_TOKEN_SARV;
const SMS_USER_SARV = process.env.SMS_USER_SARV;
const SMS_TEMPID_SARV = process.env.SMS_TEMPID_SARV;

const MSG_AUTOFILL_ID = process.env.MSG_AUTOFILL_ID;
const TWILIO_FROM_MOBILE = process.env.TWILIO_FROM_MOBILE;

function generateOtp(numbersOnly = true, length = 4) {
    const environment = process.env.NODE_ENV;
    if (!environment) {
        throw new ServerError('NODE_ENV is not present in environment variables')
    }
    if (!otpSendEnvironment.includes(environment)) {
        return otpDefault;
    }
    const characters = numbersOnly ? '0123456789' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        otp += characters.charAt(randomIndex);
    }
    return otp;
}

async function sendOtpToIndianNumbers(mobile, otp) {
    if (!SMS_API_URL_SARV) {
        throw new ServerError('SMS_API_URL_SARV is not present in environment variables');
    }
    if (!SMS_TOKEN_SARV) {
        throw new ServerError('SMS_TOKEN_SARV is not present in environment variables');
    }
    if (!SMS_USER_SARV) {
        throw new ServerError('SMS_USER_SARV is not present in environment variables');
    }
    if (!SMS_TEMPID_SARV) {
        throw new ServerError('SMS_TEMPID_SARV is not present in environment variables');
    }

    try {

        const url = `${process.env.SMS_API_URL_SARV}?token=${process.env.SMS_TOKEN_SARV
            }&user_id=${process.env.SMS_USER_SARV}&route=TR&template_id=${process.env.SMS_TEMPID_SARV
            }&sender_id=NEETCT&language=EN&template=%3C%23%3E+Your+Polysports+verification+code+is+${otp}+%0D%0AD1RO9nL5VAP+%0D%0APowered+By+Neet+Collections&contact_numbers=${mobile}`;

        const result = await get({ url });
        return result?.msg || result?.code || result.msg_text;
    } catch (error) {
        throw new ServerError(`Unable to send otp msg to ${mobile}. Otp Service Error: ${error}`)
    }
}

async function senOtpByTwilio(mobile, otp) {
    if (!accountSid) {
        throw new ServerError('TWILIO_ACCOUNT_SID is not present in environment variables');
    }
    if (!authToken) {
        throw new ServerError('TWILIO_AUTH_TOKEN is not present in environment variables');
    }
    if (!TWILIO_FROM_MOBILE) {
        throw new ServerError('TWILIO_FROM_MOBILE is not present in environment variables');
    }

    try {
        const result = await twilioClient.messages.create({
            body: `<#> Your FoodApp verification code is ${otp} \n${process.env.MSG_AUTOFILL_ID}`,
            from: process.env.TWILIO_FROM_MOBILE,
            to: mobile,
        });
        return result;
    } catch (error) {
        throw new ServerError(`Unable to send otp msg to ${mobile}. Otp TWilio Service Error: ${error}`)
    }
}

async function sendOtp(country_code, mobile, otp) {
    const environment = process.env.NODE_ENV;
    if (!environment) {
        throw new ServerError('NODE_ENV is not present in environment variables')
    }

    if (otpSendEnvironment.includes(environment)) {
        if (String(country_code) === countryCode.INDIA) {
            return await sendOtpToIndianNumbers(mobile, otp);
        } else {
            return await senOtpByTwilio(country_code + mobile, otp);
        }
    } else {
        return true;
    }
}

module.exports = {
    sendOtp,
    generateOtp
}
const ServerError = require("../error/serverError");
require("moment");
const moment = require("moment-timezone");

function dateToMillis(dateString) {
    // If dateString is not provided or empty, use today's date
    if (!dateString || dateString.trim() === '') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today.getTime();
    }

    // Otherwise, parse the provided dateString and convert it to milliseconds
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    const milliseconds = date.getTime();

    // Check if the provided dateString is valid
    if (isNaN(milliseconds)) {
        throw new ServerError('Invalid date string');
    }

    return milliseconds;
}

function concat_date_time(dateString, timeString) {
    const newDate = new Date(dateString);
    const timeArr = timeString.split(':');
    newDate.setHours(timeArr[0], timeArr[1], 0, 0);
    return newDate.toISOString().slice(0, 19).replace('T', ' ');
}

function getCurrentYmd(localAlso = false) {
    let currentDate = new Date();
    let dd = currentDate.getDate();
    if (dd < 10) {
        dd = "0" + dd;
    }
    let mm = currentDate.getMonth();
    mm = Number(mm) + 1;
    if (mm < 10) {
        mm = "0" + mm;
    }
    let yy = currentDate.getFullYear();
    return localAlso ? {
        currentDate: `${yy}-${mm}-${dd}`,
        currentDateLocal: currentDate.toLocaleTimeString()
    } : `${yy}-${mm}-${dd}`;
}

function createEpochDate(dateStr = "") {
    let dateObj;

    if (dateStr === "") {
        dateObj = new Date();
    } else {
        dateObj = new Date(dateStr);
    }

    const now_utc = Date.UTC(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate(),
        dateObj.getHours(),
        dateObj.getMinutes(),
        dateObj.getSeconds()
    );

    return new Date(now_utc).getTime() / 1000;
}


function dateTimeToDateOnly(datetime, format = "YYYY-MM-DD") {
    return moment(datetime).format(format);
}

function formatTime(timeString, formatFrom = "HH:mm:ss", formatTo = "HH:mm") {
    return moment(timeString, formatFrom).format(formatTo);
}


module.exports = {
    dateToMillis,
    getCurrentYmd,
    concat_date_time,
    createEpochDate,
    dateTimeToDateOnly,
    formatTime
}
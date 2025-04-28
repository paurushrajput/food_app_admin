const moment = require('moment');
require('moment-timezone');
const { Dubai } = require("../constants/timezone");
const ClientError = require("../error/clientError");

function datetimeToTz(datetime, timezone = Dubai) {
    return moment(datetime).tz(timezone).format('YYYY-MM-DD HH:mm:ss')
}

function currentDateTimeToTz(timezone = Dubai) {
    return moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss')
}

function getTimeOnlyOfTz(timezone = Dubai) {
    return moment().tz(timezone).format('HH:mm:ss')
}

function getDateOnlyOfTz(timezone = Dubai) {
    return moment().tz(timezone).format('YYYY-MM-DD')
}

function getDatetimeOfTz(timezone = Dubai) {
    return moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss')
}

function isDateGreaterThanToday(date) {
    const today = moment();
    const otherDate = moment(date);
    return otherDate.isAfter(today)
}

function formatDate(date, format = 'YYYY-MM-DD') {
    date = moment(date).format(format);
    if (date.includes(" -- "))
        date = date.replace("--", "at");
    return date
}

function formatDateOnly(date, format = 'YYYY-MM-DD') {
    return moment(date).format(format);
}

function getDateOnly() {
    return moment().format('YYYY-MM-DD')
}

function getServerDateTime(format = 'YYYY-MM-DD HH:mm:ss') {
    return moment().format(format);
}

function getDateTimeObj(dateTimeString, asString = true) {
    if (!dateTimeString || dateTimeString == null) {
        return null;
    }
    const dateTime = moment(dateTimeString);
    const formattedDate = dateTime.format('DD MMMM YYYY');
    const formattedTime = dateTime.format('HH:mm');
    const formattedTimeInMeridiem = dateTime.format('hh:mm A');
    if (asString) {
        return `${formattedDate} at ${formattedTime}`
    }
    return { date: formattedDate, time: formattedTime, timeInMeridiem: formattedTimeInMeridiem };
}

function getEpoch() {
    return Math.round(moment.utc().valueOf() / 1000);
    // Math.floor(Date.now() / 1000)
}

function calculateDateDifference(dateString1, dateString2, unit = 'days') {
    // Parse input strings into Moment.js objects
    const date1 = moment(dateString1);
    const date2 = moment(dateString2);

    // Calculate the difference
    const diff = date1.diff(date2, unit);

    // Return the difference
    return diff;
}

function dateToMillis(datetime) {
    const momentDate = moment(datetime);
    if (!momentDate.isValid()) {
        return null;
    }
    const millis = Math.floor(momentDate.valueOf() / 1000);
    return millis;
}


function subtractOneDayAndSetTime(dateString) {
    return moment(dateString)
        .subtract(1, 'days')
        .set({ hour: 20, minute: 0, second: 0 })
        .format('YYYY-MM-DD HH:mm:ss');
}

function formatDateSetTime(dateString) {
    return moment(dateString)
        .set({ hour: 20, minute: 0, second: 0 })
        .format('YYYY-MM-DD HH:mm:ss');
}

function splitTimeRange(startTime, endTime, interval) {
    function normalizeTime(time) {
        return time.length === 5 ? `${time}:00` : time;
    }

    startTime = normalizeTime(startTime);
    endTime = normalizeTime(endTime);

    let currentTime = moment(startTime, 'HH:mm:ss');
    const endTimeMoment = moment(endTime, 'HH:mm:ss');

    // Check if startTime is greater than or equal to endTime
    if (currentTime.isSameOrAfter(endTimeMoment)) {
        throw new Error("start at should not be greater than or equal to end at.");
    }

    const intervals = [];

    const totalMinutes = endTimeMoment.diff(currentTime, 'minutes');
    if (totalMinutes % interval !== 0) {
        throw new Error("The time range cannot be split evenly into the specified interval.");
    }

    while (currentTime.isBefore(endTimeMoment)) {
        const startSlot = currentTime.format('HH:mm:ss');

        const endSlot = currentTime.add(interval, 'minutes').format('HH:mm:ss');

        intervals.push({
            startTime: startSlot,
            endTime: endSlot
        });
    }

    return intervals;
}


function validateStartTimeAndEndTime(startTime, endTime) {
    let currentTime = moment(startTime, 'HH:mm:ss');
    const endTimeMoment = moment(endTime, 'HH:mm:ss');

    // Check if startTime is greater than or equal to endTime
    if (currentTime.isSameOrAfter(endTimeMoment)) {
        // throw new Error("startTime should not be greater than or equal to endTime.");
        return false;
    }

    return true;
}


function validateTimeSlots(timeSlots) {
    function normalizeTime(time) {
        return time.length === 5 ? `${time}:00` : time;
    }

    // Sort the time slots by start time to make comparison easier
    const sortedSlots = timeSlots.map(slot => {
        const normalizedStart = normalizeTime(slot.start_at || '');
        const normalizedEnd = normalizeTime(slot.end_at || '');

        const startMoment = moment(normalizedStart, 'HH:mm:ss');
        const endMoment = moment(normalizedEnd, 'HH:mm:ss');

        // Validate that start time is less than end time
        if (startMoment.isSameOrAfter(endMoment)) {
            throw new ClientError(`Invalid slot: start time (${normalizedStart}) should be less than end time (${normalizedEnd})`);
        }

        return {
            ...slot,
            start_at: normalizedStart,
            end_at: normalizedEnd,
            startMoment,
            endMoment
        };
    }).sort((a, b) => a.startMoment - b.startMoment);

    // Validate no overlapping intervals
    for (let i = 1; i < sortedSlots.length; i++) {
        const previousSlot = sortedSlots[i - 1];
        const currentSlot = sortedSlots[i];

        // Check if the current slot's start time is before the previous slot's end time
        if (currentSlot.startMoment.isBefore(previousSlot.endMoment)) {
            throw new Error(`Time overlap detected between slot ${i} and slot ${i + 1}`);
        }
    }

    return true;
}

function reverseTimeSlots(timeSlots) {
    const sortedSlots = timeSlots.sort((a, b) => {
        const startA = moment(a.start_at, 'HH:mm:ss');
        const startB = moment(b.start_at, 'HH:mm:ss');
        return startA - startB;
    });

    const groupedByInterval = [];

    let currentGroup = null;

    for (const slot of sortedSlots) {
        const { start_at, end_at, interval_in_mins } = slot;

        if (!currentGroup || currentGroup.interval_in_mins !== interval_in_mins) {
            if (currentGroup) {
                groupedByInterval.push(currentGroup);
            }

            currentGroup = {
                start_at,
                end_at,
                interval_in_mins,
            };
        } else {
            currentGroup.end_at = end_at;
        }
    }

    if (currentGroup) {
        groupedByInterval.push(currentGroup);
    }

    return groupedByInterval;
}

function getFromAndToDateOfMonth(timezone = Dubai) {
    const month = Number(moment.tz(timezone).format('MM'));
    const year = Number(moment.tz(timezone).format('YYYY'));
    const numOfDays = Number(moment.tz(timezone).daysInMonth());
    const from = `${year}-${month}-01 00:00:00`;
    const to = `${year}-${month}-${numOfDays} 23:59:59`
    return { from, to };
}


module.exports = {
    datetimeToTz,
    currentDateTimeToTz,
    getTimeOnlyOfTz,
    getDateOnlyOfTz,
    getDatetimeOfTz,
    isDateGreaterThanToday,
    formatDate,
    getDateOnly,
    getServerDateTime,
    getDateTimeObj,
    getEpoch,
    formatDateOnly,
    calculateDateDifference,
    dateToMillis,
    subtractOneDayAndSetTime,
    formatDateSetTime,
    splitTimeRange,
    validateStartTimeAndEndTime,
    validateTimeSlots,
    reverseTimeSlots,
    getFromAndToDateOfMonth
}
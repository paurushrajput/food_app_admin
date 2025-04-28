const { successCode, mandatoryFieldErrorCode } = require("../constants/statusCode");
const { EmailRegex } = require("../constants/variables");
const emailRegex = new RegExp(EmailRegex);
const ClientError = require("../error/clientError");

function checkMandatoryFields(args) {
  let message = '', code = successCode;
  for (let key in args) {
    if (isEmptyField(args[key])) {
      message += `${key} and `;
    }
  }
  if (message) {
    code = mandatoryFieldErrorCode;
    var substring = message.trim().lastIndexOf('and');
    message = message.substr(0, substring);
    message += "is required";
  }
  return { errorCode: code, errorMessage: message };
}

function checkMandatoryFieldsV1(args) {
  let message = '';
  for (let key in args) {
    if (isEmptyField(args[key])) {
      message += `${key} and `;
    }
  }
  if (message) {
    var substring = message.trim().lastIndexOf('and');
    message = message.substr(0, substring);
    message += "is required";

    throw new ClientError(message);
  }

  return true;
}

function isEmptyField(field) {
  if (field == null || field.toString().replace(/\s/g, "") === "") {
    return true;
  }
  else {
    return false;
  }
}

function getTrimmedValue(value, isTrimmed = true, isLowerCase = true) {
  value = value?.toString() || ""
  if (isTrimmed) value = value.trim();
  if (isLowerCase) value = value.toLowerCase();
  return value;
}

function isEmailValid(email) {
  var valid = emailRegex.test(email);
  if (!valid)
    return false;

  return true;
}

function getKeyByValue(object, targetValue) {
  for (const key in object) {
    if (object.hasOwnProperty(key) && (object[key] === targetValue || object[key].value === targetValue)) {
      return key;
    }
  }
  return null; // Return null if the value is not found in the object
}

function formatDecimal(value, decimal = 3) {
  let dividend = Number(String(1).padEnd(decimal, '0'));
  return Math.floor(Number(value) * dividend) / dividend;
}

function roundNumbers(obj, roundUpto = 2) { // roundUpto - number of decimals places to round of
  if (typeof obj === 'number') {
    return parseFloat(obj.toFixed(roundUpto));
  } else if (Array.isArray(obj)) {
    return obj.map(item => roundNumbers(item));
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj = {};
    for (let key in obj) {
      newObj[key] = roundNumbers(obj[key]);
    }
    return newObj;
  } else {
    return obj;
  }
}

function greenConsoleText(text) {
  return `\x1b[32m${text}\x1b[0m`; // ANSI code for green text
}

function groupByField(data, fieldName) {
  return data.reduce((acc, item) => {
      const key = item[fieldName];
      if (!acc[key]) {
          acc[key] = [];
      }
      acc[key].push(item.type);
      return acc;
  }, {});
}  

function isCurrentTimeBetween(startTimeEpoch, endTimeEpoch) {
  const currentTimeEpoch = Math.floor(Date.now() / 1000); // Get current time in seconds (epoch)
  return currentTimeEpoch >= startTimeEpoch && currentTimeEpoch <= endTimeEpoch;
}

function isCurrentTimeGreaterThan(endTimeEpoch) {
  const currentTimeEpoch = Math.floor(Date.now() / 1000); // Get current time in seconds (epoch)
  return currentTimeEpoch >= endTimeEpoch;
}

function isValidDate(dateString) {
  // Check the format using regular expression: "YYYY-MM-DD"
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(dateString)) {
      return false;
  }

  const [year, month, day] = dateString.split('-').map(Number);

  // Check the valid ranges for month and day
  if (month < 1 || month > 12 || day < 1 || day > 31) {
      return false;
  }

  // Create a Date object and check if it matches the original date
  const date = new Date(`${year}-${month}-${day}`);
  
  if (
      date.getFullYear() !== year ||
      date.getMonth() + 1 !== month || 
      date.getDate() !== day
  ) {
      return false;
  }

  return true;
}

function isValidTime(timeString) {
  // Regular expression to check if the string is in the "hh:mm:ss" or "hh:mm" format
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

  return timeRegex.test(timeString);
}

// Function to encode a string
function encodeString(str) {
  return btoa(str); // Using built-in Base64 encoding function
}

// Function to decode a string
function decodeString(encodedStr) {
  return atob(encodedStr); // Using built-in Base64 decoding function
}

function replaceStringVar(str = "", values = {}) {
  if(isEmptyField(str) || !Object.keys(values).length)
    return str
  
  const reg = new RegExp(Object.keys(values).join("|"), "g");
  str = str.replace(reg, (matched) => values[matched]);
  return str;
}

function isEmpty(value) {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return false;
}

function generateTwoDigitNumber() {
  // Generate a random number between 10 and 99
  return Math.floor(Math.random() * 90) + 10;
}

module.exports = {
  checkMandatoryFields,
  checkMandatoryFieldsV1,
  isEmptyField,
  isEmailValid,
  getTrimmedValue,
  getKeyByValue,
  formatDecimal,
  roundNumbers,
  greenConsoleText,
  groupByField,
  isCurrentTimeBetween,
  isCurrentTimeGreaterThan,
  isValidDate,
  isValidTime,
  encodeString,
  decodeString,
  replaceStringVar,
  isEmpty,
  generateTwoDigitNumber
}
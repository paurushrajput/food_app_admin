const { isEmptyField } = require("../utils/common");
const { UnknownUser } = require("../constants/database");


/**
 * uses
 *  const referralCodes = new ReferralCodes({
 *  length: 6,
 *  count: 1,
 *  charset: "0123456789",
 *  charset: ReferralCodes.charset("alphabetic"),
 *  prefix: "promo-",
 *  postfix: "-2015",
 *  pattern: "##-###-##",
 *  })
 *  referralCodes.generate()
 */

class ReferralCodes {
  count;
  length;
  charset;
  unique_charset;
  prefix;
  postfix;
  pattern;

  constructor(config) {
    config = config || {};
    this.count = config.count || 1;
    this.length = config.length || 11;
    this.charset = config.charset || ReferralCodes.charset("alphanumeric");
    this.unique_charset = this.uniqueCharset(this.charset);
    this.prefix = config.prefix || "";
    this.postfix = config.postfix || "";
    this.pattern = config.pattern || this.repeat("#", this.length);

    if (config.pattern) {
      this.length = (config.pattern.match(/#/g) || []).length;
    }
  }

  randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  randomElem = (arr) => {
    return arr[this.randomInt(0, arr.length - 1)];
  };

  static charset = (name) => {
    var charsets = {
      numbers: "0123456789",
      alphabetic: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      alphanumeric:
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    };
    return charsets[name];
  }

  repeat = (str, count) => {
    var res = "";
    for (var i = 0; i < count; i++) {
      res += str;
    }
    return res;
  };

  maxCombinationsCount = () => {
    return Math.pow(this.unique_charset.length, this.length);
  };

  isFeasible = () => {
    return this.maxCombinationsCount() >= this.count;
  };

  generate = () => {
    var count = this.count;

    if (!this.isFeasible()) {
      throw new Error("Not possible to generate requested number of codes.");
    }

    var map = {};
    var codes = [];

    while (count > 0) {
      var code = this.generateOne();

      if (!map[code]) {
        codes.push(code);
        map[code] = true;
        count--;
      }

    }

    return codes;
  };

  uniqueCharset = (charset) => {
    var map = {};
    var result = [];

    for (var i = 0; i < charset.length; i++) {
      const sign = charset[i];

      if (!map[sign]) {
        result.push(sign);
        map[sign] = true;
      }
    }

    return result.join("");
  };

  generateOne = () => {
    let thisObj = this;
    var code = this.pattern
      .split("")
      .map(function (char) {
        if (char === "#") {
          return thisObj.randomElem(thisObj.charset);
        } else {
          return char;
        }
      })
      .join("");
    return this.prefix + code + this.postfix;
  };

   generateAgentUsernameByName(name) {
    if(isEmptyField(name)){
      // name = UnknownUser
      return null;
    }
    // Extract the first three characters from the parameter name
    const firstFour = name.replace(/ /g,"").substring(0, 4).toUpperCase();
    // Generate a 5-digit random number
    const randomNumber = Math.floor(10000 + Math.random() * 90000);
    // Generate a random alphabet
    const randomAlphabet = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const randomAlphabet2 = String.fromCharCode(65 + Math.floor(Math.random() * 26));

    // Concatenate the generated values
    const result = `${firstFour}${randomNumber}${randomAlphabet}${randomAlphabet2}`;
    return result;
  }

  generateReferralCodeByName(name) {
    if(isEmptyField(name)){
      // name = UnknownUser
      return null;
    }
    // Extract the first three characters from the parameter name
    const firstThree = name.replace(/ /g,"").substring(0, 4).toUpperCase();
    // Generate a 4-digit random number
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    // Generate a random alphabet
    const randomAlphabet = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    // Concatenate the generated values
    const result = `${firstThree}${randomNumber}${randomAlphabet}`;
    return result;
  }
}

module.exports = ReferralCodes;



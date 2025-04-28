const { ipInfo } = require("../../utils/ip");

class UtilService {

    static async getIpInfo(userInput) {
        const { ip } = userInput;
        const result = await ipInfo(ip);
        return result;
    }
}

module.exports = UtilService;
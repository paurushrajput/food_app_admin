const UtilService = require("../../services/admin/util.service");
const RequestHandler = require("../../utils/requestHandler");

class UtilController {
  static async getIpInfoHandler(request, reply) {
    const validData = request.userInput;
    const data = await UtilService.getIpInfo(validData);
    return RequestHandler.successHandler(request, reply, data)
  }
}

module.exports = UtilController;
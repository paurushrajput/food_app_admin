const RequestHandler = require("../../utils/requestHandler");
const UserCreditsService = require("../../services/admin/userCredits.service");

class UserCreditsController {
  static async listCashoutHandler(request, reply) {
    const userInput = request.userInput;
    const data = await UserCreditsService.listCashout(userInput);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async listConvertHistoryHandler(request, reply) {
    const userInput = request.userInput;
    const data = await UserCreditsService.listConvertHistory(userInput);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async updateApproveStatusHandler(request, reply) {
    const userInput = request.userInput;
    const data = await UserCreditsService.updateApproveStatusV1(userInput);
    return RequestHandler.successHandler(request, reply, data);
  }
}

module.exports = UserCreditsController;
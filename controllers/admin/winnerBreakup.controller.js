const WinnerBreakupService = require("../../services/admin/winnerBreakup.service");
const RequestHandler = require("../../utils/requestHandler");

class WinnerBreakupController {

  static async addWinnerBreakupHandler(request, reply) {
    const validData = request.userInput;
    const data = await WinnerBreakupService.addWinnerBreakup(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async updateWinnerBreakupHandler(request, reply) {
    const validData = request.userInput;
    const data = await WinnerBreakupService.updateWinnerBreakup(validData);
    return RequestHandler.successHandler(request, reply, data)
  }

  static async getAndFilterWinnerBreakupListHandler(request, reply) {
    const validData = request.userInput;
    const data = await WinnerBreakupService.getAndFilterWinnerBreakupList(validData);
    return RequestHandler.successHandler(request, reply, data)
  }

  static async deleteWinnerBreakupHandler(request, reply) {
    const validData = request.userInput;
    const data = await WinnerBreakupService.deleteWinnerBreakup(validData);
    return RequestHandler.successHandler(request, reply, data)
  }
}

module.exports = WinnerBreakupController;
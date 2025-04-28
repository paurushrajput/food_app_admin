const CommissionPaymentHistoryService = require("../../services/admin/commissionPaymentHistory.service");
const RequestHandler = require("../../utils/requestHandler");

class CommissionPaymentHistoryController {
  static async addHandler(request, response) {
    const userInput = request.userInput;
    const data = await CommissionPaymentHistoryService.add(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async getHandler(request, response) {
    const userInput = request.userInput;
    const data = await CommissionPaymentHistoryService.get(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async updateHandler(request, response) {
    const userInput = request.userInput;
    const data = await CommissionPaymentHistoryService.update(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async deleteHandler(request, response) {
    const userInput = request.userInput;
    const data = await CommissionPaymentHistoryService.delete(userInput);
    return RequestHandler.successHandler(request, response, data);
  }
}

module.exports = CommissionPaymentHistoryController;

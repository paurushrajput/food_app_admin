const DealOptionService = require("../../services/admin/dealOption.service");
const RequestHandler = require("../../utils/requestHandler");

class DealOptionController {
  static async addDealOptionHandler(request, reply) {
    const validData = request.userInput;
    const data = await DealOptionService.addDealOption(validData);
    return RequestHandler.successHandler(request, reply, data)
  }

  static async updateDealOptionHandler(request, reply) {
    const validData = request.userInput;
    const data = await DealOptionService.updateDealOption(validData);
    return RequestHandler.successHandler(request, reply, data)
  }

  static async getDealOptionListHandler(request, reply) {
    const validData = request.userInput;
    const data = await DealOptionService.getDealOptionList(validData);
    return RequestHandler.successHandler(request, reply, data)
  }

  static async deleteDealOptionHandler(request, response) {
    const userInput = request.userInput;
    const data = await DealOptionService.deleteDealOption(userInput);
    return RequestHandler.successHandler(request, response, data);
  }
}

module.exports = DealOptionController;
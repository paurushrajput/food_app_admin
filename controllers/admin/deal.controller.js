const DealService = require("../../services/admin/deals.service");
const RequestHandler = require("../../utils/requestHandler");

class DealController {
  static async addDealHandler(request, reply) {
    const validData = request.userInput;
    const data = await DealService.addDeal(validData);
    return RequestHandler.successHandler(request, reply, data)
  }

  static async updateDealHandler(request, reply) {
    const validData = request.userInput;
    const data = await DealService.updateDeal(validData);
    return RequestHandler.successHandler(request, reply, data)
  }

  static async getDealListHandler(request, reply) {
    const validData = request.userInput;
    const data = await DealService.getDealList(validData);
    return RequestHandler.successHandler(request, reply, data)
  }

  static async deleteDealHandler(request, response) {
    const userInput = request.userInput;
    const data = await DealService.deleteDeal(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async getUserDealListHandler(request, reply) {
    const validData = request.userInput;
    const data = await DealService.getUserDealList(validData);
    return RequestHandler.successHandler(request, reply, data)
  }

  static async removeImagesHandler(request, reply) {
    const validData = request.userInput;
    const data = await DealService.removeImages(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async updateDealSequenceHandler(request, reply) {
    const validData = request.userInput;
    const data = await DealService.updateDealSequence(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async dealCategoryMigrationHandler(request, reply) {
    const validData = request.userInput;
    const data = await DealService.dealCategoryMigration(validData);
    return RequestHandler.successHandler(request, reply, data)
  }
}

module.exports = DealController;
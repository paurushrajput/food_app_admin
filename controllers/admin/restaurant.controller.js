const RestaurantService = require("../../services/admin/restaurant.service");
const RequestHandler = require("../../utils/requestHandler");

class RestaurantController {
  static async changeRestaurantStatusHandler(request, reply) {
    const validData = request.userInput;
    const data = await RestaurantService.changeRestaurantStatus(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async autoBookingStatusHandler(request, reply) {
    const validData = request.userInput;
    const data = await RestaurantService.autoBookingStatus(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async updateInfoHandler(request, reply) {
    const validData = request.userInput;
    const data = await RestaurantService.updateInfo(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getReviewsDetailsListHandler(request, reply) {
    const validData = request.userInput;
    const data = await RestaurantService.getReviewsDetailsList(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getReviewsDetailsHandler(request, reply) {
    const validData = request.userInput;
    const data = await RestaurantService.getReviewsDetails(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getSlotsHandler(request, response) {
    const userInput = request.userInput;
    const data = await RestaurantService.getSlots(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async getRestaurantsByMerchantHandler(request, response) {
    const userInput = request.userInput;
    const data = await RestaurantService.getRestaurantsByMerchant(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async updateSlotsHandler(request, response) {
    const userInput = request.userInput;
    const data = await RestaurantService.updateSlots(userInput);
    return RequestHandler.successHandler(request, response, data);
  }
}
module.exports = RestaurantController;
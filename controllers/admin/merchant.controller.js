const MerchantService = require("../../services/admin/merchant.service");
const RequestHandler = require("../../utils/requestHandler");

class MerchantController {
  static async getMerchantsHandler(request, reply) {
    const validData = request.userInput;
    const data = await MerchantService.getMerchants(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async updateMerchantHandler(request, reply) {
    const validData = request.userInput;
    const data = await MerchantService.updateMerchant(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getRestaurantsHandler(request, reply) {
    const validData = request.userInput;
    const data = await MerchantService.getRestaurants(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async restaurantApprovalHandler(request, reply) {
    const validData = request.userInput;
    const data = await MerchantService.restaurantApproval(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async restaurantDetailsHandler(request, reply) {
    const validData = request.userInput;
    const data = await MerchantService.restaurantDetails(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getRestaurantByMerchantHandler(request, reply) {
    const validData = request.userInput;
    const data = await MerchantService.getRestaurantsByMerchantId(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async changeMerchantStatusHandler(request, reply) {
    const validData = request.userInput;
    const data = await MerchantService.changeMerchantStatus(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getMerchantAccessTokenHandler(request, reply) {
    const validData = request.userInput;
    const data = await MerchantService.getMerchantAccessToken(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

}

module.exports = MerchantController;
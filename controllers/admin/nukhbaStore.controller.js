const CouponService = require("../../services/admin/coupons.service.js");
const NukhbaStoreService = require("../../services/admin/nukhbaStore.service.js");
const RequestHandler = require("../../utils/requestHandler.js");

class NukhbaStoreController {

  static async addNukhbaStoreHandler(request, reply) {
    const validData = request.userInput;
    const data = await NukhbaStoreService.add(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getNukhbaStoreHandler(request, reply) {
    const validData = request.userInput;
    const data = await NukhbaStoreService.get(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async deleteNukhbaStoreHandler(request, reply) {
    const validData = request.userInput;
    const data = await NukhbaStoreService.delete(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async updateNukhbaStoreHandler(request, reply) {
    const validData = request.userInput;
    const data = await NukhbaStoreService.update(validData);
    return RequestHandler.successHandler(request, reply, data);
  }
}

module.exports = NukhbaStoreController;
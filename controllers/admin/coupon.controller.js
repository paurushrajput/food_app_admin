const CouponService = require("../../services/admin/coupons.service.js");
const RequestHandler = require("../../utils/requestHandler.js");

class CouponController {

  static async addCouponHandler(request, reply) {
    const validData = request.userInput;
    const data = await CouponService.addCoupon(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async updateCouponHandler(request, reply) {
    const validData = request.userInput;
    const data = await CouponService.updateCoupon(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getAndFilterCouponListHandler(request, reply) {
    const validData = request.userInput;
    const data = await CouponService.getAndFilterCouponList(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async deleteCouponHandler(request, reply) {
    const validData = request.userInput;
    const data = await CouponService.deleteCoupon(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

}

module.exports = CouponController;
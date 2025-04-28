const ReservationService = require("../../services/admin/reservation.service");
const RequestHandler = require("../../utils/requestHandler");

class ReservationController {
  static async getReservationListByRestaurantHandler(request, reply) {
    const validData = request.userInput;
    const data = await ReservationService.getReservationListByRestaurant(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async cancelReservationHandler(request, reply) {
    const validData = request.userInput;
    const data = await ReservationService.cancelReservation(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getMetricsHandler(request, reply) {
    const validData = request.userInput;
    const data = await ReservationService.getMetrics(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getTopUsersByReferralHandler(request, reply) {
    const validData = request.userInput;
    const data = await ReservationService.getTopUsersByReferral(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async mostBookedRestroHandler(request, reply) {
    const validData = request.userInput;
    const data = await ReservationService.mostBookedRestro(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getInstantPaymentListHandler(request, reply) {
    const validData = request.userInput;
    const data = await ReservationService.getInstantPaymentList(validData)
    return RequestHandler.successHandler(request, reply, data);
  }
}


module.exports = ReservationController;
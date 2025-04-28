const UserService = require("../../services/admin/user.service.js");
const RequestHandler = require("../../utils/requestHandler");

class UserController {
  static async getUsersHandler(request, reply) {
    const validData = request.userInput;
    const data = await UserService.getUsers(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getAdminUsersHandler(request, reply) {
    const validData = request.userInput;
    const data = await UserService.getAdminUsers(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async changeUserStatusHandler(request, reply) {
    const validData = request.userInput;
    const data = await UserService.changeUserStatus(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async updateUserHandler(request, reply) {
    const validData = request.userInput;
    const data = await UserService.updateUser(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async addUserTicketHandler(request, reply) {
    const validData = request.userInput;
    const data = await UserService.addUserTicket(validData);
    return RequestHandler.successHandler(request, reply, data);
  }
  static async updateNukhbaUserHandler(request, reply) {
    const validData = request.userInput;
    const data = await UserService.updateNukhbaUser(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getUnusedCouponUsersHandler(request, reply) {
    const validData = request.userInput;
    const data = await UserService.getUnusedCouponUsers(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async sendNotificationsToUsersHandler(request, reply) {
    const validData = request.userInput;
    const data = await UserService.sendNotificationsToUsers(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getOtherDetailsHandler(request, reply) {
    const validData = request.userInput;
    const data = await UserService.getOtherDetails(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async checkUserExistHandler(request, reply) {
    const validData = request.userInput;
    const data = await UserService.checkUserExist(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async updateUserInviteStatusHandler(request, reply) {
    const validData = request.userInput;
    const data = await UserService.updateUserInviteStatus(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async updateUsernameScriptHandler(request, reply) {
    const validData = request.userInput;
    const data = await UserService.updateUsernameScript(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getPaymentInfoHandler(request, reply) {
    const validData = request.userInput;
    const data = await UserService.getPaymentInfo(validData);
    return RequestHandler.successHandler(request, reply, data);
  }
}

module.exports = UserController;
const NotificationService = require("../../services/admin/notification.service");
const RequestHandler = require("../../utils/requestHandler");

class NotificationController {

  static async getNotificationListHandler(request, reply) {
    const validData = request.userInput;
    const data = await NotificationService.getNotificationList(validData);
    return RequestHandler.successHandler(request, reply, data)
  }

  static async addNewHandler(request, reply) {
    const validData = request.userInput;
    const data = await NotificationService.addNew(validData);
    return RequestHandler.successHandler(request, reply, data)
  }

}

module.exports = NotificationController;
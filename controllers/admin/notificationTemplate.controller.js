const NotificationTemplateService = require("../../services/admin/notificationTemplate.service");
const RequestHandler = require("../../utils/requestHandler");

class NotificationTemplateController {
  
  static async addNotificationTemplateHandler(request, reply) {
    const validData = request.userInput;
    const data = await NotificationTemplateService.addNotificationTemplate(validData);
    return RequestHandler.successHandler(request, reply, data)
  }

  static async updateNotificationTemplateHandler(request, reply) {
    const validData = request.userInput;
    const data = await NotificationTemplateService.updateNotificationTemplate(validData);
    return RequestHandler.successHandler(request, reply, data)
  }

  static async notificationTemplateListHandler(request, reply) {
    const validData = request.userInput;
    const data = await NotificationTemplateService.notificationTemplateList(validData);
    return RequestHandler.successHandler(request, reply, data)
  }

}

module.exports = NotificationTemplateController;
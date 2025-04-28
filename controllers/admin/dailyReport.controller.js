const UserAdminService = require("../../services/admin/user.service");
const UsersModel = require("../../models/mysql/users.model");
const RequestHandler = require("../../utils/requestHandler");
const { formatDate } = require("../../utils/moment");
const ReservationService = require("../../services/admin/reservation.service");
const { isEmptyField } = require("../../utils/common");
const ServerError = require("../../error/serverError");
const DailyReportService = require("../../services/admin/dailyReport.service");
class DailyReportController {
  static async dailyReport(request, reply) {
    const validData = request?.userInput ?? {};
      const insertedData =  await DailyReportService.dailyReport(validData)
      return RequestHandler.successHandler(request, reply, insertedData);
  }

  static async getdailyReportApi(request, reply) {
    const validData = request.userInput;
      const data = await DailyReportService.getDailyReport(validData)
        return RequestHandler.successHandler(request, reply, data);
    
  }

  static async getViewUserListHandler(request, reply) {
    const validData = request.userInput;
      const data = await DailyReportService.getViewUserList(validData)
        return RequestHandler.successHandler(request, reply, data);
    
  }

}

module.exports = DailyReportController;

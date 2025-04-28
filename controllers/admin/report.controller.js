const ReportService = require("../../services/admin/report.service.js");
const RequestHandler = require("../../utils/requestHandler.js");

class ReportController {

  static async getCampaignReportHandler(request, reply) {
    const validData = request.userInput;
    const data = await ReportService.getCampaignReport(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getAgentReportHandler(request, reply) {
    const validData = request.userInput;
    const data = await ReportService.getAgentReport(validData);
    return RequestHandler.successHandler(request, reply, data);
  }
}

module.exports = ReportController;
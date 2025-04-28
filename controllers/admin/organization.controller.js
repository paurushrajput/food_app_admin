const OrganizationService = require("../../services/admin/organization.service.js");
const RequestHandler = require("../../utils/requestHandler.js");

class OrganizationController {

  static async getListHandler(request, reply) {
    const validData = request.userInput;
    const data = await OrganizationService.getList(validData);
    return RequestHandler.successHandler(request, reply, data);
  }
}

module.exports = OrganizationController;
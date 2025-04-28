const PermissionService = require("../../services/admin/permission.service");
const RequestHandler = require("../../utils/requestHandler");

class PermissionController {
  static async addHandler(request, response) {
    const userInput = request.userInput;
    const data = await PermissionService.add(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async getHandler(request, response) {
    const userInput = request.userInput;
    const data = await PermissionService.get(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async updateHandler(request, response) {
    const userInput = request.userInput;
    const data = await PermissionService.update(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async deleteHandler(request, response) {
    const userInput = request.userInput;
    const data = await PermissionService.delete(userInput);
    return RequestHandler.successHandler(request, response, data);
  }
}

module.exports = PermissionController;

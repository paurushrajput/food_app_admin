const RolePermissionService = require("../../services/admin/rolePermission.service");
const RequestHandler = require("../../utils/requestHandler");

class RolePermissionController {
  static async addHandler(request, response) {
    const userInput = request.userInput;
    const data = await RolePermissionService.add(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async getHandler(request, response) {
    const userInput = request.userInput;
    const data = await RolePermissionService.get(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async updateHandler(request, response) {
    const userInput = request.userInput;
    const data = await RolePermissionService.update(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async deleteHandler(request, response) {
    const userInput = request.userInput;
    const data = await RolePermissionService.delete(userInput);
    return RequestHandler.successHandler(request, response, data);
  }
}

module.exports = RolePermissionController;

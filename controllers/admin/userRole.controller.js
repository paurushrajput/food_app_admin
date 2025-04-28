const UserRoleService = require("../../services/admin/userRole.service");
const RequestHandler = require("../../utils/requestHandler");

class UserRoleController {
  static async addHandler(request, response) {
    const userInput = request.userInput;
    const data = await UserRoleService.add(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async getHandler(request, response) {
    const userInput = request.userInput;
    const data = await UserRoleService.get(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async updateHandler(request, response) {
    const userInput = request.userInput;
    const data = await UserRoleService.update(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async deleteHandler(request, response) {
    const userInput = request.userInput;
    const data = await UserRoleService.delete(userInput);
    return RequestHandler.successHandler(request, response, data);
  }
}

module.exports = UserRoleController;

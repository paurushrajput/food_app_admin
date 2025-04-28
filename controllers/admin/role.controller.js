const RoleService = require("../../services/admin/role.service");
const RequestHandler = require("../../utils/requestHandler");

class RoleController {
  static async addHandler(request, response) {
    const userInput = request.userInput;
    const data = await RoleService.add(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async getHandler(request, response) {
    const userInput = request.userInput;
    const data = await RoleService.get(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async updateHandler(request, response) {
    const userInput = request.userInput;
    const data = await RoleService.update(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async deleteHandler(request, response) {
    const userInput = request.userInput;
    const data = await RoleService.delete(userInput);
    return RequestHandler.successHandler(request, response, data);
  }
}

module.exports = RoleController;

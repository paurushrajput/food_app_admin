const ModuleService = require("../../services/admin/module.service");
const RequestHandler = require("../../utils/requestHandler");

class ModuleController {
  static async addHandler(request, response) {
    const userInput = request.userInput;
    const data = await ModuleService.add(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async getHandler(request, response) {
    const userInput = request.userInput;
    const data = await ModuleService.get(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async updateHandler(request, response) {
    const userInput = request.userInput;
    const data = await ModuleService.update(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async deleteHandler(request, response) {
    const userInput = request.userInput;
    const data = await ModuleService.delete(userInput);
    return RequestHandler.successHandler(request, response, data);
  }
}

module.exports = ModuleController;

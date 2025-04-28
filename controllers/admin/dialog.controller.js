const DialogService = require("../../services/admin/dialog.service");
const RequestHandler = require("../../utils/requestHandler");

class DialogController {
  static async getHandler(request, reply) {
    const validData = request.userInput;
    const data = await DialogService.get(validData);
    return RequestHandler.successHandler(request, reply, data)
  }
  
  static async addHandler(request, reply) {
    const validData = request.userInput;
    const data = await DialogService.add(validData);
    return RequestHandler.successHandler(request, reply, data)
  }

  static async updateHandler(request, reply) {
    const validData = request.userInput;
    const data = await DialogService.update(validData);
    return RequestHandler.successHandler(request, reply, data)
  }

  static async deleteHandler(request, response) {
    const userInput = request.userInput;
    const data = await DialogService.delete(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

}

module.exports = DialogController;
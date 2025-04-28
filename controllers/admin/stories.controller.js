const StoriesService = require("../../services/admin/stories.service");
const RequestHandler = require("../../utils/requestHandler");

class StoriesController {
  static async addHandler(request, response) {
    const userInput = request.userInput;
    const data = await StoriesService.add(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async getHandler(request, response) {
    const userInput = request.userInput;
    const data = await StoriesService.get(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async updateHandler(request, response) {
    const userInput = request.userInput;
    const data = await StoriesService.update(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async updateBulkHandler(request, response) {
    const userInput = request.userInput;
    const data = await StoriesService.updateBulk(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async deleteHandler(request, response) {
    const userInput = request.userInput;
    const data = await StoriesService.delete(userInput);
    return RequestHandler.successHandler(request, response, data);
  }
}

module.exports = StoriesController;

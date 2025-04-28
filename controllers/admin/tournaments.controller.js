const TournamentsService = require("../../services/admin/tournaments.service");
const RequestHandler = require("../../utils/requestHandler");

class TournamentsController {
  static async addHandler(request, response) {
    const userInput = request.userInput;
    const data = await TournamentsService.add(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async getHandler(request, response) {
    const userInput = request.userInput;
    const data = await TournamentsService.get(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async getGameListHandler(request, response) {
    const userInput = request.userInput;
    const data = await TournamentsService.getGameList(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async updateHandler(request, response) {
    const userInput = request.userInput;
    const data = await TournamentsService.update(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

  static async deleteHandler(request, response) {
    const userInput = request.userInput;
    const data = await TournamentsService.delete(userInput);
    return RequestHandler.successHandler(request, response, data);
  }
}

module.exports = TournamentsController;

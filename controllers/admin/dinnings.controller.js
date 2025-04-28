const DinningsService = require("../../services/admin/dinnings.service");
const RequestHandler = require("../../utils/requestHandler");

class DinningsController {
  static async getDinningsListHandler(request, reply) {
    const validData = request.userInput;
    const data = await DinningsService.getDinningsList(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async addDinningHandler(request, reply){
    const validData = request.userInput;
    const data =  await DinningsService.addDinning(validData);
    return RequestHandler.successHandler(request , reply , data)
  }

  static async updateDinningHandler(request,reply) {
    const validData = request.userInput;
    const data = await DinningsService.updateDinning(validData);
    return RequestHandler.successHandler(request, reply, data)
  }
}

module.exports = DinningsController;
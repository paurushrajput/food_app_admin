const BannerService = require("../../services/admin/banner.service");
const WaysToEarnService = require("../../services/admin/waysToEarn.service");
const RequestHandler = require("../../utils/requestHandler");

class WaysToEarnController {
    static async insertHandler(request, reply){
        const validData = request.userInput;
        const data =  await WaysToEarnService.add(validData);
        return RequestHandler.successHandler(request , reply , data)
      }

      static async updateWayToEarnHandler(request, reply){
        const validData = request.userInput;
        const data =  await WaysToEarnService.update(validData);
        return RequestHandler.successHandler(request , reply , data)
      }

      static async getListHandler(request, reply){
        const validData = request.userInput;
        const data =  await WaysToEarnService.list(validData);
        return RequestHandler.successHandler(request , reply , data)
      }

      static async updateWaysSequenceHandler(request, reply){
        const validData = request.userInput;
        const data =  await WaysToEarnService.updateWaysSequence(validData);
        return RequestHandler.successHandler(request , reply , data)
      }
}

module.exports = WaysToEarnController;
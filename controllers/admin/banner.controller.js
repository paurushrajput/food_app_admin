const BannerService = require("../../services/admin/banner.service");
const RequestHandler = require("../../utils/requestHandler");

class BannerController {
    static async insertBannerHandler(request, reply){
        const validData = request.userInput;
        const data =  await BannerService.add(validData);
        return RequestHandler.successHandler(request , reply , data)
      }

      static async updateBannerHandler(request, reply){
        const validData = request.userInput;
        const data =  await BannerService.update(validData);
        return RequestHandler.successHandler(request , reply , data)
      }

      static async getBannerListHandler(request, reply){
        const validData = request.userInput;
        const data =  await BannerService.get(validData);
        return RequestHandler.successHandler(request , reply , data)
      }

      static async deleteHandler(request, response) {
        const userInput = request.userInput;
        const data = await BannerService.delete(userInput);
        return RequestHandler.successHandler(request, response, data);
      }

      static async updateStatusHandler(request, response) {
        const userInput = request.userInput;
        const data = await BannerService.updateStatus(userInput);
        return RequestHandler.successHandler(request, response, data);
      }

}

module.exports = BannerController;
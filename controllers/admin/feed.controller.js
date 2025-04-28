const FeedService = require("../../services/admin/feed.service");
const RequestHandler = require("../../utils/requestHandler");

class FeedController {

    static async getListHandler(request, reply){
      const validData = request.userInput;
      const data =  await FeedService.list(validData);
      return RequestHandler.successHandler(request , reply , data)
    }

    static async updateHandler(request, reply){
      const validData = request.userInput;
      const data =  await FeedService.update(validData);
      return RequestHandler.successHandler(request , reply , data)
    }

    static async feedDetailsHandler(request, reply){
      const validData = request.userInput;
      const data =  await FeedService.feedDetails(validData);
      return RequestHandler.successHandler(request , reply , data)
    }

}

module.exports = FeedController;
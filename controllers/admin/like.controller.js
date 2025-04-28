const LikeService = require("../../services/admin/like.service");
const RequestHandler = require("../../utils/requestHandler");

class LikeController {

    static async likeListHandler(request, reply){
      const validData = request.userInput;
      const data =  await LikeService.Likelist(validData);
      return RequestHandler.successHandler(request , reply , data)
    }

}

module.exports = LikeController;
const CommentService = require("../../services/admin/comment.service");
const RequestHandler = require("../../utils/requestHandler");

class CommentController {

    static async commentListHandler(request, reply){
      const validData = request.userInput;
      const data =  await CommentService.Commentlist(validData);
      return RequestHandler.successHandler(request , reply , data)
    }

}

module.exports = CommentController;
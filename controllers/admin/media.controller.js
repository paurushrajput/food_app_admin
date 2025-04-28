const MediaService = require("../../services/admin/media.service");
const RequestHandler = require("../../utils/requestHandler");

class MediaController{
    static async insertImageHandler(request, reply){
        const validData = request.userInput;
        const data = await MediaService.addImage(validData , request , reply);
        return RequestHandler.successHandler(request,reply,data);
    }

    static async listImageHandler(request, reply){
        const validData = request.userInput;
        const data = await MediaService.listImage(validData);
        return RequestHandler.successHandler(request,reply,data);
    }
}

module.exports = MediaController;
const DeletedUserService = require("../../services/admin/deletedUsers.service.js");
const RequestHandler = require("../../utils/requestHandler");

class DeletedUserController {
  static async getHandler(request, reply) {
    const validData = request.userInput;
    const data = await DeletedUserService.get(validData);
    return RequestHandler.successHandler(request, reply, data);
  } 

  static async updateHandler(request, reply) {
    const validData = request.userInput;
    const data = await DeletedUserService.update(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getDeletedUsersInfoByIdsHandler(request, reply) {
    const validData = request.userInput;
    const data = await DeletedUserService.getDeletedUsersInfoByIds(validData);
    return RequestHandler.successHandler(request, reply, data);
  }
}

module.exports = DeletedUserController;
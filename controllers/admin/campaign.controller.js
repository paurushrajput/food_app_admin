const CampaignService = require("../../services/admin/campaign.service");
const RequestHandler = require("../../utils/requestHandler");

class CampaignController {
  static async getHandler(request, reply) {
    const validData = request.userInput;
    const data = await CampaignService.get(validData);
    return RequestHandler.successHandler(request, reply, data)
  }
  
  static async addHandler(request, reply) {
    const validData = request.userInput;
    const data = await CampaignService.add(validData);
    return RequestHandler.successHandler(request, reply, data)
  }

  static async updateHandler(request, reply) {
    const validData = request.userInput;
    const data = await CampaignService.update(validData);
    return RequestHandler.successHandler(request, reply, data)
  }

  static async deleteHandler(request, response) {
    const userInput = request.userInput;
    const data = await CampaignService.delete(userInput);
    return RequestHandler.successHandler(request, response, data);
  }

}

module.exports = CampaignController;
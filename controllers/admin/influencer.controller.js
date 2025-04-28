const InfluencerService = require("../../services/admin/influencer.service.js");
const UserService = require("../../services/admin/user.service.js");
const RequestHandler = require("../../utils/requestHandler");

class InfluencerController {
  static async getInfluencersHandler(request, reply) {
    const validData = request.userInput;
    const data = await InfluencerService.getInfluencers(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async approveHandler(request, reply) {
    const validData = request.userInput;
    const data = await InfluencerService.approveInfluencer(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async updateHandler(request, reply) {
    const validData = request.userInput;
    const data = await InfluencerService.updateInfluencer(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

}

module.exports = InfluencerController;
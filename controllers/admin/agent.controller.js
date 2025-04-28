const AgentService = require("../../services/admin/agent.service.js");
const RequestHandler = require("../../utils/requestHandler.js");

class UserController {

  static async addAgentHandler(request, reply) {
    const validData = request.userInput;
    const data = await AgentService.addAgent(validData);
    return RequestHandler.successHandler(request, reply, data);
  } 
  static async listAgentHandler(request, reply) {
    const validData = request.userInput;
    const data = await AgentService.listAgents(validData);
    return RequestHandler.successHandler(request, reply, data);
  } 
}

module.exports = UserController;
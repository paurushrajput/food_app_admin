const RequestHandler = require("../../utils/requestHandler");
const TournamentRulesService = require("../../services/admin/tournamentRules.service");

class TournamentRulesController {

    static async getAndFilterTournamentRulesListHandler(request, reply) {
        const userInput = request.userInput;
        const data = await TournamentRulesService.getAndFilterTournamentRulesList(userInput);
        return RequestHandler.successHandler(request, reply, data);
    }

    static async addTournamentRuleHandler(request, reply) {
        const userInput = request.userInput;
        const data = await TournamentRulesService.addTournamentRule(userInput);
        return RequestHandler.successHandler(request, reply, data);
    }

    static async updateTournamentRuleHandler(request, reply) {
        const userInput = request.userInput;
        const data = await TournamentRulesService.updateTournamentRule(userInput);
        return RequestHandler.successHandler(request, reply, data);
    }

    static async deleteTournamentRuleHandler(request, reply) {
        const userInput = request.userInput;
        const data = await TournamentRulesService.deleteTournamentRule(userInput);
        return RequestHandler.successHandler(request, reply, data);
    }
}

module.exports = TournamentRulesController;

// do not use try catch anywhere in this file;
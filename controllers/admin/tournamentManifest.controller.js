const RequestHandler = require("../../utils/requestHandler");
const TournamentManifestService = require("../../services/admin/tournamentManifest.service");

class TournamentManifestController {

    static async getAndFilterTournamentManifestListHandler(request, reply) {
        const userInput = request.userInput;
        const data = await TournamentManifestService.getAndFilterTournamentManifestList(userInput);
        return RequestHandler.successHandler(request, reply, data);
    }

    static async updateTournamentRankHandler(request, reply) {
        const userInput = request.userInput;
        const data = await TournamentManifestService.updateTournamentRank(userInput);
        return RequestHandler.successHandler(request, reply, data);
    }

    static async getTournamentLeaderBoardHandler(request, reply) {
        const userInput = request.userInput;
        const data = await TournamentManifestService.getTournamentLeaderBoard(userInput);
        return RequestHandler.successHandler(request, reply, data);
    }
}

module.exports = TournamentManifestController;

// do not use try catch anywhere in this file;
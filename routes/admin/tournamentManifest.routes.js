const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const adminAuth = require("../../middlewares/adminAuthentication")
const { tournamentManifestAndFilter, updateTournamentLeaderboard, getTournamentLeaderboard } = require('../../schemas/admin/tournamentManifest.schema');
const TournamentManifestController = require("../../controllers/admin/tournamentManifest.controller");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { TOURNAMENT } = require("../../constants/modules");
const moduleName = TOURNAMENT;

const tournamentManifestRoute = [
    {
        method: 'GET',
        url: '/list',
        schema: tournamentManifestAndFilter,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(TournamentManifestController.getAndFilterTournamentManifestListHandler),
    },
    {
        method: 'PUT',
        url: '/update-leaderboard-score',
        schema: updateTournamentLeaderboard,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(TournamentManifestController.updateTournamentRankHandler),
    },
    {
        method: 'GET',
        url: '/leaderboard',
        schema: getTournamentLeaderboard,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(TournamentManifestController.getTournamentLeaderBoardHandler),
    },
];


module.exports = tournamentManifestRoute;














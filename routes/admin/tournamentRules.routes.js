const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const adminAuth = require("../../middlewares/adminAuthentication")
const { getAndFilterTournamentRulesListHandler, addTournamentRuleLeaderboard, updateTournamentRuleLeaderboard, deleteTournamentRuleLeaderboard } = require('../../schemas/admin/tournamentRules.schema');
const TournamentRulesController = require("../../controllers/admin/tournamentRules.controller");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { TOURNAMENT } = require("../../constants/modules");
const moduleName = TOURNAMENT;

const tournamentRulesRoute = [
    {
        method: 'GET',
        url: '/list',
        schema: getAndFilterTournamentRulesListHandler,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(TournamentRulesController.getAndFilterTournamentRulesListHandler),
    },
    {
        method: 'POST',
        url: '/',
        schema: addTournamentRuleLeaderboard,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
        handler: asyncRouteHandler(TournamentRulesController.addTournamentRuleHandler),
    },
    {
        method: 'PUT',
        url: '/',
        schema: updateTournamentRuleLeaderboard,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(TournamentRulesController.updateTournamentRuleHandler),
    },
    {
        method: 'DELETE',
        url: '/',
        schema: deleteTournamentRuleLeaderboard,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [DELETE])],
        handler: asyncRouteHandler(TournamentRulesController.deleteTournamentRuleHandler),
    },
];


module.exports = tournamentRulesRoute;














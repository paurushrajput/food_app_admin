const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const WinnerBreakupController = require("../../controllers/admin/winnerBreakup.controller");
const { insertWinnerBreakup, updateWinnerBreakup, deleteWinnerBreakup, getCategoryListHandler } = require('../../schemas/admin/winnerBreakup.schema');
const adminAuth = require("../../middlewares/adminAuthentication");
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { TOURNAMENT } = require("../../constants/modules");
const moduleName = TOURNAMENT;

const winnerBreakupRoute = [
    {
        method: 'POST',
        url: '/',
        schema: insertWinnerBreakup,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
        handler: asyncRouteHandler(WinnerBreakupController.addWinnerBreakupHandler),
    },
    {
        method: 'PUT',
        url: '/',
        schema: updateWinnerBreakup,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(WinnerBreakupController.updateWinnerBreakupHandler)
    },
    {
        method: 'DELETE',
        url: '/',
        schema: deleteWinnerBreakup,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [DELETE])],
        handler: asyncRouteHandler(WinnerBreakupController.deleteWinnerBreakupHandler)
    },
    {
        method: 'GET',
        url: '/list',
        schema: getCategoryListHandler,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(WinnerBreakupController.getAndFilterWinnerBreakupListHandler)
    },
];

module.exports = winnerBreakupRoute;
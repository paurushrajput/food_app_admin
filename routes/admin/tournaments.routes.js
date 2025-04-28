const TournamentsController = require('../../controllers/admin/tournaments.controller');
const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const { get, add, update, deleteEntity } = require('../../schemas/admin/tournaments.schema');
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { TOURNAMENT } = require("../../constants/modules");
const moduleName = TOURNAMENT;

const tournamentsRoute = [
  {
    method: 'GET',
    url: '/get-game-list',
    schema: get,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(TournamentsController.getGameListHandler),
  },
  {
    method: 'GET',
    url: '/get',
    schema: get,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(TournamentsController.getHandler),
  },
  {
    method: 'POST',
    url: '/add',
    schema: add,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
    handler: asyncRouteHandler(TournamentsController.addHandler),
  },
  {
    method: 'PUT',
    url: '/update',
    schema: update,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(TournamentsController.updateHandler),
  },
  {
    method: 'DELETE',
    url: '/delete',
    schema: deleteEntity,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [DELETE])],
    handler: asyncRouteHandler(TournamentsController.deleteHandler),
  },
];


module.exports = tournamentsRoute;
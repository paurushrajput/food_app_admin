const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const authentication = require("../../middlewares/adminAuthentication");
const headersValidators = require("../../middlewares/adminHeadersValidators");
const { getDinningsList, add, update } = require('../../schemas/admin/dinnings.schema');
const DinningsController = require("../../controllers/admin/dinnings.controller");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { DINNING } = require("../../constants/modules");
const moduleName = DINNING;

const categoriesRoute = [
  {
    method: 'GET',
    url: '/list',
    schema: getDinningsList,
    preHandler: [headersValidators(), authentication,  checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(DinningsController.getDinningsListHandler),
  },
  {
    method: 'POST',
    url: '/add',
    schema: add,
    preHandler: [headersValidators(), authentication,  checkUserPermission(moduleName, [CREATE])],
    handler: asyncRouteHandler(DinningsController.addDinningHandler),
  },
  {
    method: 'PUT',
    url: '/update',
    schema: update,
    preHandler: [headersValidators(), authentication,  checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(DinningsController.updateDinningHandler)
  },
];


module.exports = categoriesRoute;
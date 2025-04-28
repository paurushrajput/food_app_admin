const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const authentication = require("../../middlewares/adminAuthentication");
const headersValidators = require("../../middlewares/adminHeadersValidators");
const { getAmenitiesList, add, update } = require('../../schemas/admin/amenities.schema');
const AmenitiesController = require("../../controllers/admin/amenities.controller");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { AMENITIES } = require("../../constants/modules");
const moduleName = AMENITIES;

const amenitiesRoute = [
  {
    method: 'GET',
    url: '/list',
    schema: getAmenitiesList,
    preHandler: [headersValidators(), authentication, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(AmenitiesController.getAmenitiesListHandler),
  },
  {
    method: 'POST',
    url: '/add',
    schema: add,
    preHandler: [headersValidators(), authentication, checkUserPermission(moduleName, [CREATE])],
    handler: asyncRouteHandler(AmenitiesController.addAmenitiesHandler),
  },
  {
    method: 'PUT',
    url: '/update',
    schema: update,
    preHandler: [headersValidators(), authentication, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(AmenitiesController.updateAmenitiesHandler)
  },
];


module.exports = amenitiesRoute;
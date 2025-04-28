const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const LocationController = require("../../controllers/admin/location.controller");
const { updateStatus, updateLocation, locationList, insertLocation, updateImage, listCountries, listCitiesByCountryId } = require('../../schemas/admin/location.schema');
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { LOCATION } = require("../../constants/modules");
const moduleName = LOCATION;

const locationRoute = [
  {
    method: 'PUT',
    url: '/countries/status/:id',
    schema: updateStatus,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(LocationController.updateCountryStatusHandler),
  },
  {
    method: 'PUT',
    url: '/states/status/:id',
    schema: updateStatus,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(LocationController.updateStateStatusHandler),
  },
  {
    method: 'PUT',
    url: '/cities/status/:id',
    schema: updateStatus,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(LocationController.updateCityStatusHandler),
  },
  {
    method: 'GET',
    url: '/location',
    schema: locationList,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(LocationController.getlocationListHandler),
  },
  {
    method: 'POST',
    url: '/location',
    schema: insertLocation,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
    handler: asyncRouteHandler(LocationController.insertLocationHandler),
  },
  {
    method: 'PUT',
    url: '/location/:uid',
    schema: updateLocation,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(LocationController.updateLocationHandler),
  },

  {
    method: 'GET',
    url: '/list-countries',
    schema: listCountries,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(LocationController.getAllCountryHandler),
  },

  {
    method: 'GET',
    url: '/cities/:country_id?',
    schema: listCitiesByCountryId,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(LocationController.getCityByCountryId),
  },
];


module.exports = locationRoute;
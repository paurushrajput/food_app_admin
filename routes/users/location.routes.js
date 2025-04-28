const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const authentication = require("../../middlewares/authentication");
const headersValidators = require("../../middlewares/headersValidators");

const {
  getCountryList,
  getStateList,
  getCitiesByCountry,
  getRestaurantByLocation,
  getRestaurantByLocationAndRestaurant
} = require('../../schemas/users/location.schema');
const LocationController = require("../../controllers/users/location.controller");

const locationRoute = [
  {
    method: 'GET',
    url: '/countries',
    schema: getCountryList,
    preHandler: [headersValidators(), authentication],
    handler: asyncRouteHandler(LocationController.getCountryListHandler),
  },
  {
    method: 'GET',
    url: '/states/:country_id?',
    schema: getStateList,
    preHandler: [headersValidators(), authentication],
    handler: asyncRouteHandler(LocationController.getStateListHandler),
  },
  {
    method: 'GET',
    url: '/cities/:country_id?',
    schema: getCitiesByCountry,
    preHandler: [headersValidators(), authentication],
    handler: asyncRouteHandler(LocationController.getCitiesByCountryHandler),
  },
  {
    method: 'PUT',
    url: '/user',
    preHandler: [headersValidators(), authentication],
    handler: asyncRouteHandler(LocationController.updateUserLocationHandler),
  },
  {
    method: 'GET',
    url: '/restaurants',
    schema: getRestaurantByLocation,
    preHandler: [headersValidators(), authentication],
    handler: asyncRouteHandler(LocationController.getLocationRestaurantHandler),
  },
  {
    method: 'GET',
    url: '/restaurants-details',
    schema: getRestaurantByLocationAndRestaurant,
    preHandler: [headersValidators(), authentication],
    handler: asyncRouteHandler(LocationController.getLocationRestaurantAllDataHandler),
  }
];


module.exports = locationRoute;
const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const { changeRestaurantStatus, autoBookingStatus, updateInfo, getReviewDetails, getSlots, getRestaurantByMerchant, updateSlots } = require("../../schemas/admin/restaurant.schema");
const RestaurantController = require("../../controllers/admin/restaurant.controller");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { RESTAURANT } = require("../../constants/modules");
const moduleName = RESTAURANT;

const restaurantRoute = [
    {
        method: 'GET',
        url: '/get-reviews-details-list',
        // schema: updateInfo,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(RestaurantController.getReviewsDetailsListHandler),
    },
    {
        method: 'GET',
        url: '/get-reviews-details',
        schema: getReviewDetails,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(RestaurantController.getReviewsDetailsHandler),
    },
    {
        method: 'PUT',
        url: '/status',
        schema: changeRestaurantStatus,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(RestaurantController.changeRestaurantStatusHandler),
    },
    {
        method: 'PUT',
        url: '/auto-booking',
        schema: autoBookingStatus,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(RestaurantController.autoBookingStatusHandler),
    },
    {
        method: 'PUT',
        url: '/update',
        schema: updateInfo,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(RestaurantController.updateInfoHandler),
    },
    {
        method: 'GET',
        url: '/get-slots',
        schema: getSlots,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(RestaurantController.getSlotsHandler),
    },
    {
        method: 'GET',
        url: '/merchants',
        schema: getRestaurantByMerchant,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(RestaurantController.getRestaurantsByMerchantHandler),
    },
    {
        method: 'PUT',
        url: '/update-slots',
        schema: updateSlots,
        preHandler: [adminHeadersValidators(), adminAuth],
        handler: asyncRouteHandler(RestaurantController.updateSlotsHandler),
    },
];
module.exports = restaurantRoute;
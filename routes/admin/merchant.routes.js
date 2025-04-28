const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const { getMerchantList, getRestaurantList, restaurantApproval, getRestaurantDetails, getMerchantRestaurant, changeMerchantStatus, getAccessToken, updateMerchant } = require("../../schemas/admin/merchant.schema");
const MerchantController = require("../../controllers/admin/merchant.controller");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { MERCHANT } = require("../../constants/modules");
const moduleName = MERCHANT;

const merchantRoute = [
    {
        method: 'GET',
        url: '/list',
        schema: getMerchantList,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(MerchantController.getMerchantsHandler),
    },
    {
        method: 'PUT',
        url: '/update-merchant',
        schema: updateMerchant,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(MerchantController.updateMerchantHandler),
    },
    {
        method: 'GET',
        url: '/restaurants',
        schema: getRestaurantList,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(MerchantController.getRestaurantsHandler),
    },
    {
        method: 'GET',
        url: '/restaurants-details',
        schema: getRestaurantDetails,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(MerchantController.restaurantDetailsHandler),
    },
    {
        method: 'PUT',
        url: '/restaurants-approval',
        schema: restaurantApproval,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(MerchantController.restaurantApprovalHandler),
    },
    {
        method: 'GET',
        url: '/restaurants/:merchantId',
        schema: getMerchantRestaurant,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(MerchantController.getRestaurantByMerchantHandler),
    },
    {
        method: 'PUT',
        url: '/status',
        schema: changeMerchantStatus,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(MerchantController.changeMerchantStatusHandler),
    },
    {
        method: 'GET',
        url: '/access-token',
        schema: getAccessToken,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(MerchantController.getMerchantAccessTokenHandler, true),
    },
];


module.exports = merchantRoute;
const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const BannerController = require("../../controllers/admin/banner.controller");
const { createBanner, updateBanner, bannerList, deleteBanner } = require("../../schemas/admin/banner.schema");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { WAYS_TO_EARN } = require("../../constants/modules");
const { createWaysToEarn, waysToEarnlist, updateWaysToEarn, updateSequence } = require("../../schemas/admin/waysToEarn.schema");
const WaysToEarnController = require("../../controllers/admin/waysToEarn.controller");
const moduleName = WAYS_TO_EARN;

const waysToEarnRoute = [
  {
    method: 'POST',
    url: '/create',
    schema: createWaysToEarn,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
    handler: asyncRouteHandler(WaysToEarnController.insertHandler),
  },
  {
    method: 'PUT',
    url: '/update',
    schema: updateWaysToEarn,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(WaysToEarnController.updateWayToEarnHandler),
  },
  {
    method: 'GET',
    url: '/list',
    schema: waysToEarnlist,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(WaysToEarnController.getListHandler),
  },
  {
    method: 'PUT',
    url: '/update-sequence',
    schema: updateSequence,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(WaysToEarnController.updateWaysSequenceHandler, true),
  },
];

module.exports = waysToEarnRoute;
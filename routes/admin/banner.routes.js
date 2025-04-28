const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const BannerController = require("../../controllers/admin/banner.controller");
const { createBanner, updateBanner, bannerList, deleteBanner } = require("../../schemas/admin/banner.schema");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { BANNER } = require("../../constants/modules");
const moduleName = BANNER;

const bannerRoute = [
  {
    method: 'POST',
    url: '/create',
    schema: createBanner,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
    handler: asyncRouteHandler(BannerController.insertBannerHandler),
  },
  {
    method: 'PUT',
    url: '/update',
    schema: updateBanner,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(BannerController.updateBannerHandler),
  },
  {
    method: 'GET',
    url: '/list',
    schema: bannerList,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(BannerController.getBannerListHandler),
  },
  {
    method: 'DELETE',
    url: '/delete',
    schema: deleteBanner,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [DELETE])],
    handler: asyncRouteHandler(BannerController.deleteHandler),
  },
  {
    method: 'GET',
    url: '/update-status-cron',
    handler: asyncRouteHandler(BannerController.updateStatusHandler),
  }
];

module.exports = bannerRoute;
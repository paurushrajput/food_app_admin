const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { FEEDS } = require("../../constants/modules");
const { getFeedsSchema, updateFeedSchema, feedDetailsSchema } = require("../../schemas/admin/feed.schema");
const FeedController = require("../../controllers/admin/feed.controller");
const moduleName = FEEDS;

const feedRoute = [
  {
    method: 'GET',
    url: '/list',
    schema: getFeedsSchema,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(FeedController.getListHandler),
  },
  {
    method: 'PUT',
    url: '/update',
    schema: updateFeedSchema,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(FeedController.updateHandler),
  },
  {
    method: 'GET',
    url: '/details',
    schema: feedDetailsSchema,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(FeedController.feedDetailsHandler),
  }
];

module.exports = feedRoute;
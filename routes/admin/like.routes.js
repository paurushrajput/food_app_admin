const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { LIKE } = require("../../constants/modules");
const { getLikesSchema } = require("../../schemas/admin/like.schema");
const LikeController = require("../../controllers/admin/like.controller");
const moduleName = LIKE;

const likeRoute = [
  {
    method: 'GET',
    url: '/list',
    schema: getLikesSchema,
    // preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(LikeController.likeListHandler),
  }
  
];

module.exports = likeRoute;
const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { COMMENT } = require("../../constants/modules");
const { getCommentSchema } = require("../../schemas/admin/comment.schema");
const CommentController = require("../../controllers/admin/comment.controller");
const moduleName = COMMENT;

const likeRoute = [
  {
    method: 'GET',
    url: '/list',
    schema: getCommentSchema,
    // preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(CommentController.commentListHandler),
  }
  
];

module.exports = likeRoute;
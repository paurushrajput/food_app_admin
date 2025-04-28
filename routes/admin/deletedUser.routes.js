const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const { get, update } = require("../../schemas/admin/deletedUsers.schema");
const DeletedUserController = require("../../controllers/admin/deletedUsers.controller");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { DELETED_USER } = require("../../constants/modules");
const moduleName = DELETED_USER;

const deletedUserRoute = [
  {
    method: 'GET',
    url: '/get',
    schema: get,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(DeletedUserController.getHandler),
  },
  {
    method: 'PUT',
    url: '/update',
    schema: update,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(DeletedUserController.updateHandler),
  },
  {
    method: 'POST',
    url: '/list-by-id',
    // schema: update,
    preHandler: [adminHeadersValidators(), adminAuth, /*checkUserPermission(moduleName, [UPDATE])*/],
    handler: asyncRouteHandler(DeletedUserController.getDeletedUsersInfoByIdsHandler),
  },
];


module.exports = deletedUserRoute;
const UserRoleController = require('../../controllers/admin/userRole.controller');
const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const adminAuth = require("../../middlewares/adminAuthentication");
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const { get, add, update, deleteEntity } = require('../../schemas/admin/userRole.schema');
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { USER_ROLE } = require("../../constants/modules");
const moduleName = USER_ROLE;

const userRoleRoute = [
  {
    method: 'GET',
    url: '/get',
    schema: get,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(UserRoleController.getHandler),
  },
  {
    method: 'POST',
    url: '/add',
    schema: add,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
    handler: asyncRouteHandler(UserRoleController.addHandler),
  },
  {
    method: 'PUT',
    url: '/update',
    schema: update,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(UserRoleController.updateHandler),
  },
  {
    method: 'DELETE',
    url: '/delete',
    schema: deleteEntity,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [DELETE])],
    handler: asyncRouteHandler(UserRoleController.deleteHandler),
  },
];


module.exports = userRoleRoute;
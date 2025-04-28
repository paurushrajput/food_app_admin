const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const DialogController = require("../../controllers/admin/dialog.controller");
const { get, add, update, deleteEntity } = require("../../schemas/admin/dialog.schema");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { DIALOG } = require("../../constants/modules");
const moduleName = DIALOG;

const dialogRoute = [
  {
    method: 'GET',
    url: '/get',
    schema: get,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(DialogController.getHandler),
  },
  {
    method: 'POST',
    url: '/add',
    schema: add,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
    handler: asyncRouteHandler(DialogController.addHandler, true),
  },
  {
    method: 'PUT',
    url: '/update',
    schema: update,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(DialogController.updateHandler, true),
  },
  {
    method: 'DELETE',
    url: '/delete',
    schema: deleteEntity,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [DELETE])],
    handler: asyncRouteHandler(DialogController.deleteHandler),
  }
];

module.exports = dialogRoute;
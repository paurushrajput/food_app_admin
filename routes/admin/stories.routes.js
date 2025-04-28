const StoriesController = require('../../controllers/admin/stories.controller');
const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const adminAuth = require("../../middlewares/adminAuthentication");
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const { get, add, update, deleteEntity, updateBulk } = require('../../schemas/admin/stories.schema');
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { STORIES } = require("../../constants/modules");
const moduleName = STORIES;

const storiesRoute = [
  {
    method: 'GET',
    url: '/get',
    schema: get,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(StoriesController.getHandler),
  },
  {
    method: 'POST',
    url: '/add',
    schema: add,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
    handler: asyncRouteHandler(StoriesController.addHandler),
  },
  {
    method: 'PUT',
    url: '/update',
    schema: update,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(StoriesController.updateHandler),
  },
  {
    method: 'PUT',
    url: '/update-bulk',
    schema: updateBulk,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(StoriesController.updateBulkHandler),
  },
  {
    method: 'DELETE',
    url: '/delete',
    schema: deleteEntity,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [DELETE])],
    handler: asyncRouteHandler(StoriesController.deleteHandler),
  },
];


module.exports = storiesRoute;
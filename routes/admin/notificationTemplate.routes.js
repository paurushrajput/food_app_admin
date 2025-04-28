const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const NotificationTemplateController = require("../../controllers/admin/notificationTemplate.controller");
const { createNotificationTemplate, updateNotificationTemplate, notificationTemplateList } = require("../../schemas/admin/notificationTemplate.schema");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { NOTIFICATION } = require("../../constants/modules");
const moduleName = NOTIFICATION;

const notificationTemplateRoute = [
  {
    method: 'POST',
    url: '/create',
    schema: createNotificationTemplate,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
    handler: asyncRouteHandler(NotificationTemplateController.addNotificationTemplateHandler),
  },
  {
    method: 'PUT',
    url: '/update',
    schema: updateNotificationTemplate,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(NotificationTemplateController.updateNotificationTemplateHandler),
  },
  {
    method: 'GET',
    url: '/list',
    schema: notificationTemplateList,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(NotificationTemplateController.notificationTemplateListHandler),
  },
];

module.exports = notificationTemplateRoute;
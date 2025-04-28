const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const NotificationController = require("../../controllers/admin/notification.controller");
const { sendNotification, getNotificationList } = require("../../schemas/admin/notification.schema");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { NOTIFICATION } = require("../../constants/modules");
const moduleName = NOTIFICATION;

const notificationRoute = [
  {
    method: 'GET',
    url: '/list',
    schema: getNotificationList,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(NotificationController.getNotificationListHandler),
  },

  {
    method: 'POST',
    url: '/send',
    schema: sendNotification,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
    handler: asyncRouteHandler(NotificationController.addNewHandler),
  },
];

module.exports = notificationRoute;
const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const {
    getUserList,
    changeUserStatus,
    addUserTicket,
    updateNukhbaSchema,
    getUnusedCouponUserList,
    sendNotification,
    getUserCount,
    updateUserInvite,
    getIpInfo
} = require("../../schemas/admin/user.schema");
const UserController = require("../../controllers/admin/user.controller");
const adminAuth = require("../../middlewares/adminAuthentication");
const basicAuth = require("../../middlewares/basicAuthentication");
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { USER } = require("../../constants/modules");
const UtilController = require("../../controllers/admin/util.controller");
const moduleName = USER;

const userRoute = [
    {
        method: 'GET',
        url: '/list',
        schema: getUserList,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(UserController.getUsersHandler),
    },
    {
        method: 'GET',
        url: '/admin-list',
        schema: getUserList,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(UserController.getAdminUsersHandler),
    },
    {
        method: 'PUT',
        url: '/status',
        schema: changeUserStatus,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(UserController.changeUserStatusHandler),
    },
    {
        method: 'PUT',
        url: '/update',
        // schema: changeUserStatus,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(UserController.updateUserHandler),
    },
    {
        method: 'POST',
        url: '/add-user-ticket',
        schema: addUserTicket,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
        handler: asyncRouteHandler(UserController.addUserTicketHandler),
    },
    {
        method: 'PUT',
        url: '/nukhba-user',
        schema: updateNukhbaSchema,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(UserController.updateNukhbaUserHandler),
    },
    {
        method: 'GET',
        url: '/unused-coupon-user-list',
        schema: getUnusedCouponUserList,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(UserController.getUnusedCouponUsersHandler),
    },
    {
        method: 'POST',
        url: '/send-notification',
        schema: sendNotification,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
        handler: asyncRouteHandler(UserController.sendNotificationsToUsersHandler),
    },
    {
        method: "POST",
        url: "/other-details",
        preHandler: [adminHeadersValidators(), adminAuth],
        handler: asyncRouteHandler(UserController.getOtherDetailsHandler),
    },
    {
        method: "POST",
        url: "/user-exist",
        schema: getUserCount,
        preHandler: [adminHeadersValidators(), basicAuth],
        handler: asyncRouteHandler(UserController.checkUserExistHandler),
    },
    {
        method: "POST",
        url: "/update-user-invite",
        schema: updateUserInvite,
        preHandler: [adminHeadersValidators(), basicAuth],
        handler: asyncRouteHandler(UserController.updateUserInviteStatusHandler),
    },
    {
        method: "GET",
        url: "/update-username-script",
        preHandler: [adminHeadersValidators(), basicAuth],
        handler: asyncRouteHandler(UserController.updateUsernameScriptHandler, true),
    },
    {
        method: "GET",
        url: "/get-payment-info",
        preHandler: [adminHeadersValidators(), adminAuth],
        handler: asyncRouteHandler(UserController.getPaymentInfoHandler, true),
    },
    {
        method: "GET",
        url: "/ip-info",
        schema: getIpInfo,
        preHandler: [basicAuth],
        handler: asyncRouteHandler(UtilController.getIpInfoHandler),
    }
];


module.exports = userRoute;

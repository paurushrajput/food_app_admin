const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const AuthController = require("../../controllers/admin/auth.controller");
const { adminLogin, adminCreate, addContactInfo, adminUpdate } = require("../../schemas/admin/auth.schema");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { AUTH } = require("../../constants/modules");
const moduleName = AUTH;

const adminRoute = [
    {
        method: 'POST',
        url: '/register',
        schema: adminCreate,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
        handler: asyncRouteHandler(AuthController.createHandler, true),
    },
    {
        method: 'PUT',
        url: '/admin-update',
        schema: adminUpdate,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
        handler: asyncRouteHandler(AuthController.updateAdminHandler, true),
    },
    {
        method: 'POST',
        url: '/login',
        schema: adminLogin,
        handler: asyncRouteHandler(AuthController.loginHandler),
    },
    {
        method: 'PUT',
        url: '/contact-us',
        schema: addContactInfo,
        preHandler: [adminHeadersValidators(), adminAuth],
        handler: asyncRouteHandler(AuthController.addContactInfoHandler),
    },
    {
        method: "GET",
        url: "/contact-us",
        preHandler: [adminHeadersValidators(), adminAuth],
        handler: asyncRouteHandler(AuthController.getContactInfoHandler),
    },
    {
        method: "GET",
        url: "/logout",
        preHandler: [adminHeadersValidators(), adminAuth],
        handler: asyncRouteHandler(AuthController.logoutHandler),
    },
    {
        method: "GET",
        url: "/list",
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(AuthController.getAdminListHandler),
    },
    {
        method: "GET",
        url: "/permissions",
        preHandler: [adminHeadersValidators(), adminAuth],
        handler: asyncRouteHandler(AuthController.getPermissionsHandler),
    },
];

module.exports = adminRoute;
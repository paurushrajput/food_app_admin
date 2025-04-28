const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const AppConfigController = require("../../controllers/admin/appconfig.controller");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const { createConfig, updateConfig, listConfig, updateAppVersion } = require("../../schemas/admin/appconfig.schema");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { APP_CONFIG } = require("../../constants/modules");
const moduleName = APP_CONFIG;

const appConfigRoute = [
    {
        method: 'POST',
        url: '/create',
        schema: createConfig,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
        handler: asyncRouteHandler(AppConfigController.insertAppConfigHandler)
    },
    {
        method: 'PUT',
        url: '/update/:uid',
        schema: updateConfig,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(AppConfigController.updateAppConfigHandler)
    },
    {
        method: 'GET',
        url: '/list',
        schema: listConfig,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(AppConfigController.listAppConfigHandler)
    },
    {
        method: 'PUT',
        url: '/app-version',
        schema: updateAppVersion,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(AppConfigController.updateAppVersionHandler)
    },
    {
        method: 'GET',
        url: '/app-version',
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(AppConfigController.getAppVersionHandler)
    },
]
module.exports = appConfigRoute
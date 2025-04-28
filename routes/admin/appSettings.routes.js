const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const AppSettingsController = require("../../controllers/admin/appSettings.controller")
const { insertAppSettings, updateAppSettings, updateAppSettingsBulk, deleteAppSettings, appSettingsAndFilter } = require('../../schemas/admin/appSettings.schema');
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { APP_SETTING } = require("../../constants/modules");
const moduleName = APP_SETTING;

const appSettingsRoute = [
    {
        method: 'POST',
        url: '/',
        schema: insertAppSettings,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
        handler: asyncRouteHandler(AppSettingsController.addAppSettingsHandler),
    },
    {
        method: 'PUT',
        url: '/',
        schema: updateAppSettings,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(AppSettingsController.updateAppSettingsHandler)
    },
    {
        method: 'PUT',
        url: '/bulk',
        schema: updateAppSettingsBulk,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(AppSettingsController.updateAppSettingsBulkHandler)
    },
    {
        method: 'DELETE',
        url: '/',
        schema: deleteAppSettings,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [DELETE])],
        handler: asyncRouteHandler(AppSettingsController.deleteAppSettingHandler)
    },
    {
        method: 'GET',
        url: '/list',
        schema: appSettingsAndFilter,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(AppSettingsController.getAndFilterAppSettingsHandler)
    },
];

module.exports = appSettingsRoute;
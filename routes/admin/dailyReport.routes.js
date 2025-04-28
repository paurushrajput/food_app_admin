const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const { getList, add, userList } = require('../../schemas/admin/dailyReport.schema');
const DailyReportController = require("../../controllers/admin/dailyReport.controller");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { REPORT } = require("../../constants/modules");
const moduleName = REPORT;

const dailyReportRoute = [
    {
        method: 'POST',
        url: '',
        schema: add,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
        handler: asyncRouteHandler(DailyReportController.dailyReport),
    },
    {
        method: 'GET',
        url: '',
        schema: getList,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(DailyReportController.getdailyReportApi),
    },
    {
        method: 'GET',
        url: '/active-users-list',
        schema: userList,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(DailyReportController.getViewUserListHandler),
    },
];


module.exports = dailyReportRoute;
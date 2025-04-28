const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const ReportController = require("../../controllers/admin/report.controller");
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const adminAuth = require("../../middlewares/adminAuthentication")
const { getCampaignReport, getAgentReport } = require("../../schemas/admin/report.schema");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { REPORT } = require("../../constants/modules");
const moduleName = REPORT;

const reportRoutes = [
    {
        method: 'GET',
        url: '/campaign',
        schema: getCampaignReport,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(ReportController.getCampaignReportHandler),
    },
    {
        method: 'GET',
        url: '/agent',
        schema: getAgentReport,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(ReportController.getAgentReportHandler),
    },
];


module.exports = reportRoutes;
const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const OrganizationController = require("../../controllers/admin/organization.controller");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { ORGANIZATION } = require("../../constants/modules");
const moduleName = ORGANIZATION;

const organizationRoute = [
    {
        method: 'GET',
        url: '/list',
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(OrganizationController.getListHandler),
    },
];


module.exports = organizationRoute;
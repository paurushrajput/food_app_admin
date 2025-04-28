const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const adminAuth = require("../../middlewares/adminAuthentication");

const { 
  listCashoutRequest, 
  updateApproveStatus, 
} = require('../../schemas/admin/userCredit.schema');
const UserCreditsController = require("../../controllers/admin/userCredits.controller");

//permission
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { USER_CREDITS } = require("../../constants/modules");
const moduleName = USER_CREDITS;

const userCreditsRoute = [
  {
    method: 'GET',
    url: '/list-cashout-request',
    schema: listCashoutRequest,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(UserCreditsController.listCashoutHandler),
  },
  {
    method: 'GET',
    url: '/list-convert-history',
    schema: listCashoutRequest,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(UserCreditsController.listConvertHistoryHandler),
  },
  {
    method: 'PUT',
    url: '/update-approve-status',
    schema: updateApproveStatus,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(UserCreditsController.updateApproveStatusHandler, true),
  }
];


module.exports = userCreditsRoute;
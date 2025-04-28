const CommissionPaymentHistoryController = require('../../controllers/admin/commissionPaymentHistory.controller');
const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const { get, add, update, deleteEntity } = require('../../schemas/admin/commissionPaymentHistory.schema');
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { COMMISSION } = require("../../constants/modules");
const moduleName = COMMISSION;

const commissionPaymentHistoryRoute = [
  {
    method: 'GET',
    url: '/get',
    schema: get,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(CommissionPaymentHistoryController.getHandler),
  },
  {
    method: 'POST',
    url: '/add',
    schema: add,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
    handler: asyncRouteHandler(CommissionPaymentHistoryController.addHandler),
  },
  {
    method: 'PUT',
    url: '/update',
    schema: update,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(CommissionPaymentHistoryController.updateHandler),
  },
  {
    method: 'DELETE',
    url: '/delete',
    schema: deleteEntity,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [DELETE])],
    handler: asyncRouteHandler(CommissionPaymentHistoryController.deleteHandler),
  },
];


module.exports = commissionPaymentHistoryRoute;
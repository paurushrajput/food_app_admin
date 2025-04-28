const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const {  paymentListAndFilter } = require("../../schemas/admin/payments.schema");
const PaymentsController = require("../../controllers/admin/payments.controller");
const adminAuth = require("../../middlewares/adminAuthentication")
const verifyIP = require("../../middlewares/verifyIp")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { PAYMENTS } = require("../../constants/modules");
const moduleName = PAYMENTS;

const paymentsRoute = [
    {
        method: 'GET',
        url: '/list',
        schema: paymentListAndFilter,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(PaymentsController.listPaymentsHandler),
    },
    {
        method: 'POST',
        url: '/update-txn-code',
        schema: paymentListAndFilter,
        preHandler: [],
        handler: asyncRouteHandler(PaymentsController.updatePaymentTxnCodeHandler),
    },
    {
        method: 'POST',
        url: '/update-payment-info',
        schema: paymentListAndFilter,
        preHandler: [],
        handler: asyncRouteHandler(PaymentsController.getPaymentInfoByRefTxnIdHandler),
    }
]
module.exports = paymentsRoute;
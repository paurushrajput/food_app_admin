const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const { addCoupon, updateCoupon, getAndFilterCouponList, deleteCoupon } = require("../../schemas/admin/coupon.schema");
const CouponController = require("../../controllers/admin/coupon.controller");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const NukhbaStoreController = require("../../controllers/admin/nukhbaStore.controller");
const { addNukhbaStore } = require("../../schemas/admin/nukhbaStore.schema");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { NUKHBA_STORE } = require("../../constants/modules");
const moduleName = NUKHBA_STORE;

const nukhbaStore = [
    {
        method: 'POST',
        url: '/add',
        schema: addNukhbaStore,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
        handler: asyncRouteHandler(NukhbaStoreController.addNukhbaStoreHandler),
    },
    {
        method: 'PUT',
        url: '/update',
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(NukhbaStoreController.updateNukhbaStoreHandler),
    },
    {
        method: 'GET',
        url: '/list',
        // schema: getAndFilterCouponList,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(NukhbaStoreController.getNukhbaStoreHandler),
    },
    {
        method: 'DELETE',
        url: '/remove',
        // schema: deleteCoupon,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [DELETE])],
        handler: asyncRouteHandler(NukhbaStoreController.deleteNukhbaStoreHandler),
    }
];


module.exports = nukhbaStore;
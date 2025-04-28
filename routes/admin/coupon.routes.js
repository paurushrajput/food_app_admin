const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const { addCoupon, updateCoupon, getAndFilterCouponList, deleteCoupon } = require("../../schemas/admin/coupon.schema");
const CouponController = require("../../controllers/admin/coupon.controller");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { COUPON } = require("../../constants/modules");
const moduleName = COUPON;

const couponRoute = [
    {
        method: 'POST',
        url: '/add',
        schema: addCoupon,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
        handler: asyncRouteHandler(CouponController.addCouponHandler),
    },
    {
        method: 'PUT',
        url: '/update',
        schema: updateCoupon,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(CouponController.updateCouponHandler),
    },
    {
        method: 'GET',
        url: '/list',
        schema: getAndFilterCouponList,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(CouponController.getAndFilterCouponListHandler),
    },
    {
        method: 'DELETE',
        url: '/remove',
        schema: deleteCoupon,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [DELETE])],
        handler: asyncRouteHandler(CouponController.deleteCouponHandler),
    }
];


module.exports = couponRoute;
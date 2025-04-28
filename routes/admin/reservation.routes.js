const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const { getReservationList, instantPaymentListSchema } = require('../../schemas/admin/reservation.schema');
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const ReservationController = require("../../controllers/admin/reservation.controller");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { RESERVATION } = require("../../constants/modules");
const moduleName = RESERVATION;

const reservationRoute = [
    {
        method: 'GET',
        url: '/list',
        schema: getReservationList,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(ReservationController.getReservationListByRestaurantHandler),
    },
    {
        method: 'POST',
        url: '/cancel',
        // schema: cancelReservation,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
        handler: asyncRouteHandler(ReservationController.cancelReservationHandler, true),
    },
    {
        method: 'GET',
        url: '/metrics',
        // schema: cancelReservation,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(ReservationController.getMetricsHandler),
    },
    {
        method: 'GET',
        url: '/top-users-by-referral',
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(ReservationController.getTopUsersByReferralHandler),
    },
    {
        method: 'GET',
        url: '/most-booked-restro',
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(ReservationController.mostBookedRestroHandler),
    },
    {
        method: 'GET',
        url: '/instant-payment',
        schema: instantPaymentListSchema,
        preHandler: [adminHeadersValidators(), adminAuth],
        handler: asyncRouteHandler(ReservationController.getInstantPaymentListHandler),
    },
];

module.exports = reservationRoute;
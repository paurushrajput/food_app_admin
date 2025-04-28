const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const ReviewsController = require("../../controllers/admin/reviews.controller");
const { getReviewsList } = require('../../schemas/admin/reviews.schema');
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { REVIEW } = require("../../constants/modules");
const moduleName = REVIEW;

const reviewsRoute = [
  {
    method: 'GET',
    url: '/restaurants',
    schema: getReviewsList,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(ReviewsController.getReviewsListByRestaurantHandler),
  }
];
module.exports = reviewsRoute;
const ReviewsService = require("../../services/admin/reviews.service");
const RequestHandler = require("../../utils/requestHandler");

class ReviewsController {
    static async getReviewsListByRestaurantHandler(request, reply) {
        const validData = request.userInput;
        const data = await ReviewsService.getReviewsListByRestaurant(validData);
        return RequestHandler.successHandler(request, reply, data);
      }
}
module.exports = ReviewsController;
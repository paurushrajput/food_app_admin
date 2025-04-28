const ReviewsModel = require("../../models/mysql/reviews.model");
const RestaurantsModel = require("../../models/mysql/restaurants.model");
const ClientError = require("../../error/clientError");
const {checkMandatoryFields, isEmptyField, getTrimmedValue} = require("../../utils/common.js");
const {Pagination} = require("../../constants/database.js");

class ReviewsService {
  /**
  * list reviews and overall rating of restaurant
  * @param {string} body - res_id, pagination values.
  */
  static async getReviewsListByRestaurant(body) {
    let {
      page,
      page_size,
      is_paginated,
      sort_by,
      order,
      keyword,
      from_date,
      to_date,
      res_uid,
      reservation_id,
      user,
    } = body;

    if(isEmptyField(sort_by)) sort_by = Pagination.defaultSortColumn;
    if(isEmptyField(order)) order = Pagination.defaultOrder;
    if(isEmptyField(page)) page = Pagination.defaultPage;
    if(isEmptyField(page_size)) page_size = Pagination.defaultPage;
    if(getTrimmedValue(is_paginated) === "false") is_paginated = false;
    else is_paginated = true;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    // let restaurant;
    // if (!isEmptyField(res_uid)) {
    //   [restaurant] = await RestaurantsModel.findRestaurantById(res_uid);
    //   if(!restaurant)
    //     throw new ClientError('Invalid restaurant_id');
    // }

   // const [overAllRating] = await ReviewsModel.getOverallReviewsByRestaurant({res_id: restaurant.id})
    const response = await ReviewsModel.list({
      sort,
      limit,
      offset, 
      keyword, 
      is_paginated,
      from_date,
      to_date,
      res_id: res_uid,
      reservation_id
    })

    return {
     /* overAllRating:   {
        "avg_rating": Number(overAllRating.avg_rating || 0),
        "star_5_count": Number(overAllRating.star_5_count || 0),
        "star_4_count": Number(overAllRating.star_4_count || 0),
        "star_3_count": Number(overAllRating.star_3_count || 0),
        "star_2_count": Number(overAllRating.star_2_count || 0),
        "star_1_count": Number(overAllRating.star_1_count || 0)
      },*/
      count: response.count,
      rows: response.rows
    };
  }
 
 
}

module.exports = ReviewsService;
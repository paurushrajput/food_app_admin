const ClientError = require("../../error/clientError");
const {
  isEmptyField,
  getTrimmedValue,
  isEmpty,
  getKeyByValue,
} = require("../../utils/common.js");

const FeedModel = require("../../models/mysql/feeds.model.js");
const { Pagination, FEED_TYPE, Bit } = require("../../constants/database.js");
const ServerError = require("../../error/serverError.js");
const UsersModel = require("../../models/mysql/users.model.js");
const { getUrlFromBucket } = require("../../utils/s3.js");

class FeedService {
  static async list(body) {
    let {
      page = 1,
      page_size = 10,
      is_paginated = true,
      sort_by = "",
      order = "",
    } = body;

    if (isEmptyField(sort_by)) sort_by = Pagination.defaultSortColumn;
    if (isEmptyField(order)) order = Pagination.defaultOrder;
    if (isEmptyField(page)) page = Pagination.defaultPage;
    if (isEmptyField(page_size)) page_size = Pagination.pageSize;
    if (getTrimmedValue(is_paginated) === "false") is_paginated = false;
    else is_paginated = true;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const response = await FeedModel.list({
      sort,
      limit,
      offset,
      is_paginated,
    });

    if(isEmpty(response)){
      throw new ServerError()
    }

    const collected_user_ids = []
    response?.rows?.map((item)=>{
      collected_user_ids.push(item.user_id)
    })

    const unique_user_ids = [...new Set(collected_user_ids)];
    let usersResult
    if(isEmpty(unique_user_ids)){
      return {
        count: Number(response?.count ?? 0) ,
        rows: [],
      };
    }

    if(!isEmpty(unique_user_ids)){
      usersResult = await UsersModel.getAllUserByIds(unique_user_ids)
    }

    const modifiedUsers = usersResult?.map(el => {
      const profile_pic = getUrlFromBucket(el?.profile_pic,true)
      return {
        id: el.id,
        uid: el.uid,
        first_name: el.first_name,
        last_name: el.last_name,
        full_name: el.full_name,
        username: el.username,
        email: el.email,
        mobile: el.mobile,
        country_code: el.country_code,
        profile_pic: profile_pic
      }
    })

    const updatedResponse = []
    if(!isEmpty(response?.rows)){
      for(let i=0;i<response?.rows?.length;i++){
        const item = response?.rows[i]
        let obj = {
          feed_id:item?.feed_id,
          restaurant:{
            name:item?.details?.restaurant?.name,
            place_id:item?.details?.restaurant?.place_id,
          },
          type:item.post_type,
          like_count:item.like_count ?? 0,
          comment_count:item.comment_count ?? 0,
          created_at: item?.created_at,
          status:item?.status,
        }
        // add user
        for(let j=0 ;j < modifiedUsers?.length;j++){
          const user_item = modifiedUsers[j]
          if(user_item.id == item.user_id ){
            obj['user'] = {
              id: user_item.uid,
              full_name: user_item.full_name,
              profile_pic: user_item.profile_pic,
            }
          }
        }

        updatedResponse.push(obj)
      }
    }

    return {
      count: Number(response?.count ?? 0) ,
      rows: updatedResponse || [],
    };
  }

  static async update(body) {
    let {
      feed_id,
      status
    } = body;

    // check if feed exist
    const feedResult = await FeedModel.getFeed({feed_id})
    const feed = feedResult?.rows[0]
    if(isEmpty(feed)){
      throw new ClientError('Post not found')
    }

    const updateResult = await FeedModel.update({feed_id,status})
    const count = updateResult.count
    
    return {
      rows: count == Bit.one ? 'Feed Updated' : 'Feed unable to update',
    };
  }

  static async feedDetails(body) {
    let {
      feed_id
    } = body;

    // check if feed exist
    const feedResult = await FeedModel.getFeed({feed_id})
    const feed = feedResult?.rows[0]
    const ratingData = feed?.details?.rating
    if(isEmpty(feed)){
      throw new ClientError('Post not found')
    }

    const favDishes = ratingData?.favorite_dishes?.join(", ")

    let rating_images = ratingData?.images ?? []
         
    let updated_rating_images = []
    if(!isEmpty(rating_images)){
        for(let z=0;z<rating_images?.length;z++){
            let item2 = rating_images[z]
            let updatedImage =  getUrlFromBucket(item2) 
            updated_rating_images.push(updatedImage)
        }
    }

    const ratingDetails = {
        score: Number(ratingData?.score ?? 0),
        images: updated_rating_images,
        labels: ratingData?.labels,
        created_at: ratingData?.created_at ?? null ,
        visit_date: ratingData?.visit_date ?? null ,
        secret_mode: Number(ratingData?.secret_mode ?? 0),
        favorite_dishes: favDishes ?? '',
        note: ratingData?.note ?? '',
    }
    
    return {
      rating:ratingDetails
    };
  }

}
module.exports = FeedService;

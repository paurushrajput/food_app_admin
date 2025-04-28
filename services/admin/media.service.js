
const handleImageUpload = require("../../utils/mediaService");
const MediaModel = require("../../models/mysql/media.model");
const { isEmptyField, getTrimmedValue } = require("../../utils/common");
const { getUrlFromBucket } = require("../../utils/s3");

class MediaService {
  static async addImage(body, reqService , reply ){
    let imgD;
    let url ;
    let uploadImage;
    if (!reqService.isMultipart()) {
      console.log("Request is not multipart. Skipping file handling.");
    }else{
        const data = await handleImageUpload(reqService, reply);
        if (data) {
          uploadImage = {
            basepath: data.filepath,
            filename: data.filename,
            type: "image",
          };
          await MediaModel.insert(uploadImage);
          const imageData = await MediaModel.getImageByName(data.filename);
          imgD = imageData[0].uid;
          url = getUrlFromBucket(imageData[0]?.icon) 
        }
    }
    return {media_id: imgD , url};
   }

   static async listImage(body){
    let {
      page = 1,
      page_size = 10,
      is_paginated = true,
      sort_by = 'created_at',
      order = 'desc',
      keyword,
      from_date,
      to_date,
      id,
      type,
      status,
      searchBy
    } = body;
   
    if(isEmptyField(sort_by)) sort_by = Pagination.defaultSortColumn;
    if(isEmptyField(order)) order = Pagination.defaultOrder;
    if(isEmptyField(page)) page = Pagination.defaultPage;
    if(isEmptyField(page_size)) page_size = Pagination.pageSize;
    if(getTrimmedValue(is_paginated) === "false") is_paginated = false;
    else is_paginated = true;
    
    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const response = await MediaModel.list({
      sort, 
      limit, 
      offset, 
      keyword, 
      is_paginated,
      from_date,
      to_date,
      id,
      type,
      status,
      searchBy
    })

    response.rows = response?.rows?.map(el=>({...el, image: getUrlFromBucket(el.image_url)})) || []

    return {
      count: response?.count || 0,
      rows: response?.rows || []
    };
    
   }
}

  module.exports = MediaService;
  
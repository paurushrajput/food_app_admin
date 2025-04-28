const StoriesModel = require("../../models/mysql/stories.model.js");
const MediaModel = require("../../models/mysql/media.model");
const ClientError = require("../../error/clientError");
const {checkMandatoryFields, checkMandatoryFieldsV1, isEmptyField, getTrimmedValue} = require("../../utils/common.js");
const { mandatoryFieldErrorCode } = require("../../constants/statusCode");
const { getUrlFromBucket } = require("../../utils/s3");
const { Pagination } = require("../../constants/database");

class StoriesService {
  /**
  * list stories
  * @param {string} body - pagination values.
  */
  static async get(body) {
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
      user,
      status
    } = body;
    

    // if(isEmptyField(sort_by)) sort_by = 'created_at';
    // if(isEmptyField(order)) order = 'desc';
    // if(isEmptyField(page)) page = 1;
    // if(isEmptyField(page_size)) page_size = 10;
    // if(getTrimmedValue(is_paginated) === "false") is_paginated = false;
    // else is_paginated = true;

    if(isEmptyField(sort_by)) sort_by = Pagination.defaultSortColumn;
    if(isEmptyField(order)) order = Pagination.defaultOrder;
    if(isEmptyField(page)) page = Pagination.defaultPage;
    if(isEmptyField(page_size)) page_size = Pagination.pageSize;
    if(getTrimmedValue(is_paginated) === "false") is_paginated = false;
    else is_paginated = true;
    
    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const response = await StoriesModel.list({
      sort, 
      limit, 
      offset, 
      keyword, 
      is_paginated,
      from_date,
      to_date,
      id,
      type,
      status
    })

    response.rows = response?.rows?.map(el=>({...el, image: getUrlFromBucket(el.image)})) || []

    return {
      count: response?.count || 0,
      rows: response?.rows || []
    };
  }

  /**
  * add story
  * @param {string} body - name, email values.
  */
   static async add(body) {
    let {
      title,
      image_id,
      duration,
      type,
      action,
      user,
      sequence
    } = body;
    
    const mandatoryFieldStatus = checkMandatoryFields({
      image_id,
      duration,
      type
    });

    if (mandatoryFieldStatus.errorCode == mandatoryFieldErrorCode) {
      throw new ClientError(mandatoryFieldStatus.errorMessage);
    }

    // const [story] = await StoriesModel.isStoriesExist({
    //   columns: ["game_id"],
    //   values: [game_id],
    // });

    // if (story) 
    //   throw new ClientError("Stories For This Game Already Added");

    let getMediaId
    if(!isEmptyField(image_id)){
      [getMediaId] = await MediaModel.getOneByuId(image_id);

      if(!getMediaId)
        throw new ClientError("image not found in media");
    }
    
    if(isEmptyField(sequence)){
      const [stories] = await StoriesModel.findMaxSequence();
      sequence = Number(stories.sequence) + 1
    }

    const insertObj = { 
      title,
      image_id: getMediaId?.id || null,
      duration,
      type,
      action,
      sequence,
      created_by: user,
      updated_by: user,
    };
  
    await StoriesModel.insert(insertObj);

    return { msg: 'Stories Added' };
  }

  /**
  * update story
  * @param {string} body - name, email values.
  */
   static async update(body) {
    let {
      title,
      image_id,
      duration,
      type,
      status,
      action,
      id,
      sequence,
      user,
    } = body;

    const mandatoryFieldStatus = checkMandatoryFields({
      id
    });

    if (mandatoryFieldStatus.errorCode == mandatoryFieldErrorCode) {
      throw new ClientError(mandatoryFieldStatus.errorMessage);
    }

    const [story] = await StoriesModel.getOneByColumns({
      columns: ["uid"],
      values: [id],
    });

    if (!story) throw new ClientError("Stories not found");
    
    const updateObj = { updated_by: user };

    let getMediaId
    if(!isEmptyField(image_id)){
      [getMediaId] = await MediaModel.getOneByuId(image_id);

      if(!getMediaId)
        throw new ClientError("image not found in media");

      updateObj.image_id = getMediaId?.id;
    }

    if(!isEmptyField(title)) updateObj.title = title;
    if(!isEmptyField(duration)) updateObj.duration = duration;
    if(!isEmptyField(type)) updateObj.type = type;
    if(!isEmptyField(status)) updateObj.status = status;
    if(!isEmptyField(action)) updateObj.action = action;
    if(!isEmptyField(sequence)) updateObj.sequence = sequence;
  
    await StoriesModel.updateOneById(updateObj, story.id);

    return { msg: 'Stories Updated' };
  }

  /**
  * update bulk stories
  * @param {string} body - name, email values.
  */
  static async updateBulk(body) {
    let {
      stories,
      user,
    } = body;

    const storiesMappedArr = [];
    for(let story of stories){
      checkMandatoryFieldsV1({id: story.id});
  
      const [storyExist] = await StoriesModel.getOneByColumns({
        columns: ["uid"],
        values: [story.id],
      });
  
      if (!storyExist) throw new ClientError(`Stories not found for ID: ${story.id}`);
      
  
      let getMediaId
      if(!isEmptyField(story.image_id)){
        [getMediaId] = await MediaModel.getOneByuId(story.image_id);
        if(!getMediaId)
          throw new ClientError(`image not found in media for ID: ${story.id}`);
  
          story.getMediaId = getMediaId;
      }

      story.id = storyExist.id;
      storiesMappedArr.push(story);
    }
    

    for(let story of storiesMappedArr){
      const updateObj = { updated_by: user };

      if(!isEmptyField(story.getMediaId?.id)) updateObj.image_id = story.getMediaId?.id;
      if(!isEmptyField(story.title)) updateObj.title = story.title;
      if(!isEmptyField(story.duration)) updateObj.duration = story.duration;
      if(!isEmptyField(story.type)) updateObj.type = story.type;
      if(!isEmptyField(story.status)) updateObj.status = story.status;
      if(!isEmptyField(story.action)) updateObj.action = story.action;
      if(!isEmptyField(story.sequence)) updateObj.sequence = story.sequence;
    
      await StoriesModel.updateOneById(updateObj, story.id);
    }

    return { msg: 'Stories Updated' };
  }

  /**
  * delete story
  * @param {string} body - story id.
  */
  static async delete(body) {
    let {
      id,
      user,
    } = body;

    const mandatoryFieldStatus = checkMandatoryFields({
      id
    });

    if (mandatoryFieldStatus.errorCode == mandatoryFieldErrorCode) {
      throw new ClientError(mandatoryFieldStatus.errorMessage);
    }

    const [story] = await StoriesModel.getOneByColumns({
      columns: ["uid"],
      values: [id],
    });

    if (!story) throw new ClientError("Stories not found");
    
    const updateObj = {
      deleted_at: `now()`
    };
  
    await StoriesModel.updateOneById(updateObj, story.id);

    return { msg: 'Stories Deleted' };
  }
}

module.exports = StoriesService;
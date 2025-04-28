const AmenitiesModel = require("../../models/mysql/amenities.model");
const { getUrlFromBucket } = require("../../utils/s3");
const MediaModel = require("../../models/mysql/media.model");
const ClientError = require("../../error/clientError");
const { Pagination, Status, Bit } = require("../../constants/database");
const { checkMandatoryFields, isEmptyField, getTrimmedValue } = require("../../utils/common.js");

class AmenitiesService {
  /**
  * list reviews and overall rating of restaurant
  * @param {string} body - res_id, pagination values.
  */
  static async getAmenitiesList(body) {
    let {
      page = 1,
      page_size = 10,
      is_paginated = true,
      sort_by = 'created_at',
      order = 'desc',
      keyword,
      user,
      from_date,
      to_date,
      amenities_id,
      status
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

    const response = await AmenitiesModel.listAmenities({
      sort,
      offset,
      limit,
      keyword,
      is_paginated,
      from_date,
      to_date,
      amenities_id,
      status
    })

    response.rows = response?.rows?.map(el => ({ ...el, icon: getUrlFromBucket(el.icon) })) || []

    return {
      count: response?.count || 0,
      rows: response?.rows || []
    };
  }

  static async addAmenities(body) {
    const { name, icon } = body;

    const [amenitiesExist] = await AmenitiesModel.isAminityExistWithSameName(name);
    if (amenitiesExist)
      throw new ClientError("Amenities exist with same name");

    let getMediaId
    if (!isEmptyField(icon)) {
      [getMediaId] = await MediaModel.getOneByuId(icon);

      if (!getMediaId)
        throw new ClientError("icon not found");
    }

    const obj = {
      name: name,
      icon: getMediaId?.id || null
    };

    const { rows } = await AmenitiesModel.insert(obj);
    if (rows != 1) {
      throw new GeneralError('An error occurred while creating account. Please try again.');
    }

    return {
      msg: "Amenities added successfully"
    };
  }

  static async updateAmenities(body) {
    let { id, name, status, icon } = body;

    const [amenities] = await AmenitiesModel.getAmenitiesByColumn({ column: "uid", value: [id] });

    if (!amenities)
      throw new ClientError("Amenities not found");

    let updateObj = {};

    if (!isEmptyField(status)) {
      updateObj.status = status
    }

    if (!isEmptyField(name)) {
      updateObj.name = name
    }

    if (!isEmptyField(icon)) {
      const [getMediaId] = await MediaModel.getOneByuId(icon);
      if (!getMediaId)
        throw new ClientError("icon not found");
      updateObj.icon = getMediaId.id
    }

    const { rows } = await AmenitiesModel.updateOneById(updateObj, amenities.id);
    if (rows == 1) {
      if (Number(updateObj?.status) == Bit.zero) {
        await AmenitiesModel.deleteRestaurantAmenities(amenities.id);
      }
    }

    return {
      msg: "Amenities updated successfully"
    };
  }
}


module.exports = AmenitiesService;
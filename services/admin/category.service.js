const CategoryModel = require("../../models/mysql/category.model");
const { uploadFile, deleteFile, getUrlFromBucket } = require("../../utils/s3");
const handleImageUpload = require("./media.service");
const MediaModel = require("../../models/mysql/media.model");
const { Pagination, Status, Bit } = require("../../constants/database");
const { checkMandatoryFields, isEmptyField, getTrimmedValue } = require("../../utils/common.js");
const ClientError = require("../../error/clientError");

class CategoryService {
  static async updateCategory(body) {
    let { uid, status, name, icon, type } = body;

    const [category] = await CategoryModel.getOneByuId(uid);
    if (!category) throw new ClientError("Category not found");

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
    if (!isEmptyField(type)) {
      updateObj.type = type;
    }
    const response = await CategoryModel.updateOneById(updateObj, category.id);
    if (response.rows == 1) {
      if (Number(updateObj.status) == Bit.zero) {
        await CategoryModel.deleteRestaurantCategories(category.id);
      }
    }

    return response;
  }

  /**
* list all locations and list city by id
* @param {string} body -location Body
*/
  static async getCategoryList(body) {
    let {
      page = 1,
      page_size = 10,
      is_paginated = true,
      sort_by = 'cat.sequence asc, cat.created_at',
      order = 'desc',
      keyword,
      from_date,
      to_date,
      name,
      type,
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
    const response = await CategoryModel.listCategories({
      sort,
      offset,
      limit,
      is_paginated,
      keyword,
      from_date,
      to_date,
      name,
      type,
      status
    });
    return {
      count: response.count,
      rows: response.rows?.map(each => {
        const { id,uid, ...rest } = each;
        return{
          ...rest,
          id:each.uid,
          //for old work
          uid:uid,
          icon: getUrlFromBucket(rest.icon)
        }
      })
    };
  }

  static async insertCategory(body) {
    const { status, type, name, icon } = body;
    // const getMediaId = await MediaModel.getOneByuId(icon);

    const [categoryExist] = await CategoryModel.isCategoryExistWithSameName(name);
    if (categoryExist)
      throw new ClientError("Category exist with same name");

    let getMediaId
    if (!isEmptyField(icon)) {
      [getMediaId] = await MediaModel.getOneByuId(icon);

      if (!getMediaId)
        throw new ClientError("image not found in media");
    }

    const obj = {
      status: !isEmptyField(status) ? status : Status.one,
      name: name,
      type: type,
      icon: getMediaId?.id
    };

    const { rows } = await CategoryModel.insert(obj);
    if (rows != 1) {
      throw new GeneralError('An error occurred while creating account. Please try again.');
    }
    return rows;
  }

  static async updateSequence(body) {
    const { categories, user, dbTransaction } = body;

    for (let category of categories) {
      const [existingCategory] = await CategoryModel.getOneByuId(category.id, dbTransaction);
      if (!existingCategory) throw new ClientError("Invalid category")
      const { rows } = await CategoryModel.updateOneById({ sequence: category.sequence }, existingCategory.id, dbTransaction);
      if (rows < 1) {
        throw new ServerError("Unable to update category")
      }
    }

    return {
      msg: 'Category Sequence updated'
    }
  }

}
module.exports = CategoryService;
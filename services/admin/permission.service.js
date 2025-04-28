const ClientError = require("../../error/clientError");
const ServerError = require("../../error/serverError");
const { isEmptyField, getTrimmedValue } = require("../../utils/common");
const { Pagination } = require("../../constants/database");
const PermissionModel = require("../../models/mysql/permission.model");
const ModulesModel = require("../../models/mysql/modules.model");

class ModuleService {

  static async get(data) {
    let {
      page,
      page_size,
      is_paginated,
      sort_by,
      order,
      type,
      keyword
    } = data;

    if (isEmptyField(sort_by)) sort_by = Pagination.defaultSortColumn;
    if (isEmptyField(order)) order = Pagination.defaultOrder;
    if (isEmptyField(page)) page = Pagination.defaultPage;
    if (isEmptyField(page_size)) page_size = Pagination.pageSize;
    if (getTrimmedValue(is_paginated) === "false") is_paginated = false;
    else is_paginated = true;

    const sort = `${sort_by} ${order}`;
    const limit = Number(page_size);
    const offset = (Number(page) - 1) * Number(page_size);

    const response = await PermissionModel.list({
      sort,
      limit,
      offset,
      is_paginated,
      type,
      keyword,
    });

    return {
      count: response.count,
      rows: response.rows,
    };
  }

  static async add(data) {
    let {
      module_id,
      type,
    } = data;

    const [module] = await ModulesModel.findOneByuId(module_id);

    //checking if module exists
    if (!module) {
      throw new ClientError("Module not found");
    }

    const [isPermissionExist] = await PermissionModel.checkIfPermissionExist(module.id, type);

    if (isPermissionExist) {
      throw new ClientError("Permission already exist");
    }

    const insertObj = {
      module_id: module.id,
      type
    };
    const { rows } = await PermissionModel.insert(insertObj);

    if (rows < 1) {
      throw new ServerError("Unable to add permission");
    }

    return {
      msg: "Permission added successfully",
    };
  }

  static async update(data) {
    const {
      id,
      module_id,
      type,
    } = data;

    const [permission] = await PermissionModel.findOneByuId(id);

    //checking if permission exists
    if (!permission) {
      throw new ClientError("Permission not found");
    }

    const updateObj = {};

    if (!isEmptyField(module_id)) {
      const [module] = await ModulesModel.findOneByuId(module_id);

      //checking if coupons exists
      if (!module) {
        throw new ClientError("Module not found");
      }
      updateObj.module_id = module.id;
    }

    if (!isEmptyField(type)) {
      updateObj.type = type;
    }

    if (Object.keys(updateObj).length < 1) {
      throw new ClientError("No data to update");
    }

    const moduleId = updateObj.module_id ? updateObj.module_id : permission.module_id;
    const permissionType = updateObj.type ? updateObj.type : permission.type;
    const [isPermissionExist] = await PermissionModel.checkIfPermissionExist(moduleId, permissionType);

    if (isPermissionExist && isPermissionExist.id != permission.id) {
      throw new ClientError("Permission already exist");
    }

    const { rows } = await PermissionModel.updateOneById(
      updateObj,
      permission.id
    );

    if (rows < 1) {
      throw new ServerError("Unable to update permission");
    }

    return {
      msg: "Permission updated successfully",
    };
  }

  static async delete(data) {
    let { id } = data;

    const [permission] = await PermissionModel.findOneByuId(id);

    //checking if coupons exists
    if (!permission) {
      throw new ClientError("Permission not found");
    }

    //hard delete
    await PermissionModel.hardDelete(permission.id);

    return {
      msg: "Permission deleted successfully",
    };
  }
}

module.exports = ModuleService;

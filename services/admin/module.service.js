const ClientError = require("../../error/clientError");
const ServerError = require("../../error/serverError");
const { isEmptyField, getTrimmedValue } = require("../../utils/common");
const { Pagination } = require("../../constants/database");
const ModulesModel = require("../../models/mysql/modules.model");

class ModuleService {

  static async get(data) {
    let {
      page,
      page_size,
      is_paginated,
      sort_by,
      order,
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

    const response = await ModulesModel.list({
      sort,
      limit,
      offset,
      is_paginated,
      keyword,
    });

    return {
      count: response.count,
      rows: response.rows,
    };
  }

  static async add(data) {
    let {
      name,
    } = data;

    const insertObj = {
      name,
    };

    const [isModuleExist] = await ModulesModel.checkIfModuleExist(getTrimmedValue(name));

    if (isModuleExist) {
      throw new ClientError("Module already exist");
    }

    const { rows } = await ModulesModel.insert(insertObj);

    if (rows < 1) {
      throw new ServerError("Unable to add module");
    }

    return {
      msg: "Module added successfully",
    };
  }

  static async update(data) {
    const {
      id,
      name,
    } = data;

    const [module] = await ModulesModel.findOneByuId(id);

    //checking if module exists
    if (!module) {
      throw new ClientError("Module not found");
    }

    const updateObj = {};

    if (!isEmptyField(name)) {
      updateObj.name = name;
    }

    if (Object.keys(updateObj).length < 1) {
      throw new ClientError("No data to update");
    }

    const moduleName = updateObj.name ? updateObj.name : module.name;
    const [isModuleExist] = await ModulesModel.checkIfModuleExist(getTrimmedValue(moduleName));

    if (isModuleExist && isModuleExist.id != module.id) {
      throw new ClientError("Module already exist");
    }

    const { rows } = await ModulesModel.updateOneById(
      updateObj,
      module.id
    );

    if (rows < 1) {
      throw new ServerError("Unable to update module");
    }

    return {
      msg: "Module updated successfully",
    };
  }

  static async delete(data) {
    let { id } = data;

    const [module] = await ModulesModel.findOneByuId(id);

    //checking if coupons exists
    if (!module) {
      throw new ClientError("Module not found");
    }

    //hard deleting
    await ModulesModel.hardDelete(module.id);

    return {
      msg: "Module deleted successfully",
    };
  }
}

module.exports = ModuleService;

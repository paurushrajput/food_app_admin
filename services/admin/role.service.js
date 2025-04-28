const ClientError = require("../../error/clientError");
const ServerError = require("../../error/serverError");
const { isEmptyField, getTrimmedValue } = require("../../utils/common");
const { Pagination } = require("../../constants/database");
const RoleModel = require("../../models/mysql/role.model");

class RoleService {

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

    const response = await RoleModel.list({
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
      name,								//mandatory
    } = data;

    const insertObj = {
      name,
      role_key: name.toLowerCase().replace(/ /g, "_"),
    };

    const [isRoleExist] = await RoleModel.checkIfRoleExist(getTrimmedValue(name));

    if (isRoleExist) {
      throw new ClientError("Role already exist");
    }

    const { rows } = await RoleModel.insert(insertObj);

    if (rows < 1) {
      throw new ServerError("Unable to add role");
    }

    return {
      msg: "Role added successfully",
    };
  }

  static async update(data) {
    const {
      id,
      name,
    } = data;

    const [role] = await RoleModel.findOneByuId(id);

    //checking if role exists
    if (!role) {
      throw new ClientError("Role not found");
    }

    const updateObj = {};

    if (!isEmptyField(name)) {
      updateObj.name = name;
      updateObj.role_key = name.toLowerCase().replace(/ /g, "_");
    }

    if (Object.keys(updateObj).length < 1) {
      throw new ClientError("No data to update");
    }

    const roleName = updateObj.name ? updateObj.name : role.name;
    const [isRoleExist] = await RoleModel.checkIfRoleExist(getTrimmedValue(roleName));

    if (isRoleExist && isRoleExist.id != role.id) {
      throw new ClientError("Role already exist");
    }

    const { rows } = await RoleModel.updateOneById(
      updateObj,
      role.id
    );

    if (rows < 1) {
      throw new ServerError("Unable to update role");
    }

    return {
      msg: "Role updated successfully",
    };
  }

  static async delete(data) {
    let { id } = data;

    const [role] = await RoleModel.findOneByuId(id);

    //checking if coupons exists
    if (!role) {
      throw new ClientError("Role not found");
    }

    //hard deleting
    await RoleModel.hardDelete(role.id);

    return {
      msg: "Role deleted successfully",
    };
  }
}

module.exports = RoleService;

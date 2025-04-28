const ClientError = require("../../error/clientError");
const ServerError = require("../../error/serverError");
const { isEmptyField, getTrimmedValue } = require("../../utils/common");
const { Pagination } = require("../../constants/database");
const UserRoleModel = require("../../models/mysql/userRole.model");
const UsersModel = require("../../models/mysql/users.model");
const RoleModel = require("../../models/mysql/role.model");
const AdminAuthModel = require("../../models/mysql/admin.model");

class UserRoleService {

  static async get(data) {
    let {
      page,
      page_size,
      is_paginated,
      sort_by,
      order,
      keyword,
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

    const response = await UserRoleModel.list({
      sort,
      limit,
      offset,
      is_paginated,
      keyword
    });

    return {
      count: response.count,
      rows: response.rows?.map(elem => {
        const contactInfo = elem?.contact_info || {};
        delete elem?.contact_info;
        return {
          ...elem,
          ...contactInfo,
        }
      }),
    };
  }

  static async add(data) {
    let {
      user_id,
      role_id,
      _role_id,
      dbTransaction
    } = data;

    const [user] = await AdminAuthModel.getAdminById(user_id, dbTransaction);

    if (!user) {
      throw new ClientError("User not found");
    }

    const [role] = isEmptyField(_role_id) ? await RoleModel.findOneByuId(role_id, dbTransaction) : await RoleModel.findOneById(_role_id, dbTransaction);

    if (!role) {
      throw new ClientError("Role not found");
    }

    const [isUserRoleExist] = await UserRoleModel.checkIfUserRoleExist(user.id, role.id, dbTransaction);

    if (isUserRoleExist) {
      throw new ClientError("User Role already exist");
    }

    const insertObj = {
      user_id: user.id,
      role_id: role.id,
    };
    const { rows } = await UserRoleModel.insert(insertObj, dbTransaction);

    if (rows < 1) {
      throw new ServerError("Unable to add user role");
    }

    return {
      msg: "User role added successfully",
    };
  }

  static async update(data) {
    const {
      id,
      user_id,
      role_id,
    } = data;

    const [userRole] = await UserRoleModel.findOneByuId(id);

    if (!userRole) {
      throw new ClientError("User Role not found");
    }

    const updateObj = {};

    if (!isEmptyField(user_id)) {
      const [user] = await AdminAuthModel.getAdminById(user_id);

      if (!user) {
        throw new ClientError("User not found");
      }
      updateObj.user_id = user.id;
    }

    if (!isEmptyField(role_id)) {
      const [role] = await RoleModel.findOneByuId(role_id);

      if (!role) {
        throw new ClientError("Role not found");
      }
      updateObj.role_id = role.id;
    }

    if (Object.keys(updateObj).length < 1) {
      throw new ClientError("No data to update");
    }

    const userId = updateObj.user_id ? updateObj.user_id : userRole.user_id;
    const roleId = updateObj.role_id ? updateObj.role_id : userRole.role_id;
    const [isUserRoleExist] = await UserRoleModel.checkIfUserRoleExist(userId, roleId);

    if (isUserRoleExist && isUserRoleExist.id != userRole.id) {
      throw new ClientError("User Role already exist");
    }

    const { rows } = await UserRoleModel.updateOneById(
      updateObj,
      userRole.id
    );

    if (rows < 1) {
      throw new ServerError("Unable to update user role");
    }

    return {
      msg: "User role updated successfully",
    };
  }

  static async delete(data) {
    let { id } = data;

    const [userRole] = await UserRoleModel.findOneByuId(id);

    if (!userRole) {
      throw new ClientError("User role not found");
    }

    await UserRoleModel.hardDelete(userRole.id);

    return {
      msg: "User role deleted successfully",
    };
  }
}

module.exports = UserRoleService;

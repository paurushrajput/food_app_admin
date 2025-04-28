const ClientError = require("../../error/clientError");
const ServerError = require("../../error/serverError");
const { isEmptyField, getTrimmedValue, groupByField } = require("../../utils/common");
const { Pagination, Bit } = require("../../constants/database");
const RolePermissionModel = require("../../models/mysql/rolePermission.model");
const ModulesModel = require("../../models/mysql/modules.model");
const RoleModel = require("../../models/mysql/role.model");
const PermissionModel = require("../../models/mysql/permission.model");
const AuthService = require("./auth.service");

class RolePermissionService {

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

    const response = await RolePermissionModel.list({
      sort: `COALESCE (rp.updated_at, rp.created_at)`,
      limit,
      offset,
      is_paginated,
      keyword
    });

    return {
      count: response.count,
      rows: response?.rows?.reduce((acc, item) => {
        if (!acc[item.module_name]) {
          acc[item.module_name] = [];
        }
        acc[item.module_name].push(item);
        return acc;
      }, {}),
    };
  }

  static async add(data) {
    let {
      dbTransaction,
      permissions
    } = data;

    for (let permissionBody of permissions) {
      let { permission_id, role_id } = permissionBody;
      const [permission] = await PermissionModel.findOneByuId(permission_id, dbTransaction);

      if (!permission) {
        throw new ClientError("Permission not found");
      }

      const [role] = await RoleModel.findOneByuId(role_id, dbTransaction);

      if (!role) {
        throw new ClientError("Role not found");
      }

      const [isRolePermissionExist] = await RolePermissionModel.checkIfRolePermissionExist(permission.id, role.id, dbTransaction);

      if (isRolePermissionExist) {
        throw new ClientError("Role Permission already exist");
      }

      const insertObj = {
        permission_id: permission.id,
        role_id: role.id,
      };
      const { rows } = await RolePermissionModel.insert(insertObj, dbTransaction);

      if (rows < 1) {
        throw new ServerError("Unable to add role permission");
      }

      //updating redis role permission cache when role permission is updated for that particular role
      await AuthService.updateRolePermission([role.role_key], true);
    }

    return {
      msg: "Role permission added successfully",
    };
  }

  static async update(data) {
    const {
      permissions,
      dbTransaction
    } = data;

    for (let permissionBody of permissions) {
      const { id, permission_id, role_id, del = Bit.zero } = permissionBody;

      const [rolePermission] = await RolePermissionModel.findOneByuId(id, dbTransaction);

      if (!rolePermission) {
        throw new ClientError("Permission not found");
      }

      const updateObj = {};

      if (!isEmptyField(permission_id)) {
        const [permission] = await PermissionModel.findOneByuId(permission_id, dbTransaction);

        if (!permission) {
          throw new ClientError("Permission not found");
        }
        updateObj.permission_id = permission_id.id;
      }

      let [role] = []

      if (!isEmptyField(role_id)) {
        [role] = await RoleModel.findOneByuId(role_id, dbTransaction);

        if (!role) {
          throw new ClientError("Role not found");
        }
        updateObj.role_id = role.id;
      } else {
        [role] = await RoleModel.findOneById(rolePermission.role_id, dbTransaction);
      }

      if (Object.keys(updateObj).length < 1) {
        throw new ClientError("No data to update");
      }

      if (del == Bit.one) {
        //deleting
        await RolePermissionModel.hardDelete(rolePermission.id, dbTransaction);
      } else {
        //updating
        const permissionId = updateObj.permission_id ? updateObj.permission_id : rolePermission.permission_id;
        const roleId = updateObj.role_id ? updateObj.role_id : rolePermission.role_id;
        const [isRolePermissionExist] = await RolePermissionModel.checkIfRolePermissionExist(permissionId, roleId, dbTransaction);

        if (isRolePermissionExist && isRolePermissionExist.id != rolePermission.id) {
          throw new ClientError("Role Permission already exist");
        }

        const { rows } = await RolePermissionModel.updateOneById(
          updateObj,
          rolePermission.id,
          dbTransaction
        );

        if (rows < 1) {
          throw new ServerError("Unable to update role permission");
        }
      }


      //updating redis role permission cache when role permission is updated for that particular role
      await AuthService.updateRolePermission([role.role_key], true);
    }

    return {
      msg: "Role permission updated successfully",
    };
  }

  static async delete(data) {
    let { id } = data;

    const [rolePermission] = await RolePermissionModel.findOneByuId(id);

    if (!rolePermission) {
      throw new ClientError("Role permission not found");
    }

    await RolePermissionModel.hardDelete(rolePermission.id);

    //updating redis role permission cache when role permission is updated for that particular role
    await AuthService.updateRolePermission([role.role_key], true);

    return {
      msg: "Role permission deleted successfully",
    };
  }
}

module.exports = RolePermissionService;

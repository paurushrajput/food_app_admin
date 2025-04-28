const ClientError = require("../../error/clientError");
const AdminModel = require("../../models/mysql/admin.model");
const GeneralError = require("../../error/generalError");
const ServerError = require("../../error/serverError");
const { Bit, Pagination, ADMIN_ROLE_TYPE, NUKHBA_EMAIL_DOMAIN } = require("../../constants/database");
const { createJwt } = require("../../utils/jwt");
const { hashPass, comparePass } = require("../../utils/bcrypt");
const { checkMandatoryFieldsV1, isEmptyField, isEmailValid, getTrimmedValue, groupByField } = require('../../utils/common');
const { mandatoryFieldErrorCode } = require("../../constants/statusCode");
const { MaxConcurrentLoginLimit } = require("../../constants/variables");
const SecretsManager = require('../../utils/secretManager');
const RoleModel = require("../../models/mysql/role.model");
const UserRoleService = require("./userRole.service");
const secretName = "food-app";
const region = process.env.AWS_SECRETS_REGION;
const { SUPER_ADMIN_ROLE } = require("../../constants/roles");
const UserRoleModel = require("../../models/mysql/userRole.model");
const { getData, setDataNoTtl } = require("../../dbConfig/redisConnect");
const ModulesModel = require("../../models/mysql/modules.model");
const { CREATE, READ, UPDATE, DELETE } = require("../../constants/permission");

const secretsManagerObj = new SecretsManager(secretName, region)
class AuthService {

    static async makeDatabseEntry(logins) {
        const result = await AdminModel.insert(logins);
        return result;
    }

    //user to token conversion
    static async userToToken(admin) {
        let _user = { admin_id: admin };
        const token = await createJwt(_user);
        return token;
    }


    static async create(body) {
        let { email, password, role_id, dbTransaction } = body;

        email = getTrimmedValue(email);
        const [existAdmin] = await AdminModel.getAdminByEmail(email, dbTransaction);

        if (existAdmin) {
            throw new ClientError(`An user already exist with email - ${email}`);
        }

        const [role] = await RoleModel.findOneByuId(role_id);
        if (!role) {
            throw new ClientError("Role not found")
        }

        if (role.role_key == SUPER_ADMIN_ROLE) throw new ClientError("Super admin cannot be created. Please choose different role");

        if (!email.endsWith(NUKHBA_EMAIL_DOMAIN)) throw new ClientError(`Email should end with ${NUKHBA_EMAIL_DOMAIN}`);

        const hashedPass = await hashPass(password);
        const insertObject = {
            email: email,
            password: hashedPass
        };

        const { rows } = await AdminModel.insert(insertObject, dbTransaction);
        if (rows < 1) {
            throw new ClientError("Unable to create admin");
        }

        const [admin] = await AdminModel.getAdminByEmail(email, dbTransaction);
        await UserRoleService.add({ user_id: admin.id, _role_id: role.id, dbTransaction });

        return {
            msg: 'New Admin Created',
        }
    }

    static async login(body) {
        let { email, password } = body;

        email = getTrimmedValue(email);

        const [existAdmin] = await AdminModel.getAdminRoleAndDataByEmail(email);

        if (!existAdmin) {
            throw new ClientError("Invalid Email. User does not exists with this email")
        }

        const userRole = existAdmin?.roles || [];
        if (!userRole || userRole.length < 1) {
            throw new ClientError("User Role not found");
        }

        if (!userRole.map(role => role.role_key).includes(SUPER_ADMIN_ROLE)) {
            return await AuthService.loginSubAdmin(body);
        }

        // const adminPassKey = `nb_admin_prod_${existAdmin.id}`
        const adminPassKey = `admin_${existAdmin.id}`;
        const getSecretPassword = await secretsManagerObj.getSecret(adminPassKey);
        const isPassMatched = await comparePass(password, getSecretPassword.value);
        if (!isPassMatched) throw new ClientError("Password does not match");

        const permissions = {};
        for (let role of userRole) {
            const permission = await AuthService.getPermissionByRoleKey(role.role_key);
            permissions[role.role_key] = permission;
        }

        const token = await AuthService.userToToken(existAdmin.id)
        // await AdminModel.updateOneById({ token }, findAdmin.id)
        await AuthService.updateAdminTokenForLogin(existAdmin, token);
        return {
            msg: 'Admin Logged In',
            role: userRole,
            token,
            permissions
        }
    }

    /**
   * add contact info handler
   * @param {string} body - name, email, country_code, mobile.
   */
    static async addContactInfo(body) {
        const {
            name,
            email,
            country_code,
            mobile,
            user
        } = body;

        checkMandatoryFieldsV1({ name, email, country_code, mobile });

        if (!isEmailValid(email))
            throw new ClientError("Please enter a valid email");

        const insertObj = {
            name,
            email: email.toString().toLowerCase(),
            country_code,
            mobile,
        };

        await AdminModel.updateOneById({ contact_info: insertObj }, user);

        return { msg: "Contact Info Updated Successfully", data: insertObj };
    }

    /**
    * get contact info handler
    * @param {string} body - name, email, country_code, mobile.
    */
    static async getContactInfo(body) {
        const { user } = body;
        const [admin] = await AdminModel.getAdminById(user);
        if (!admin)
            throw new ClientError("Contact-us info not found");
        return admin.contact_info;
    }

    static async updateAdminTokenForLogin(admin, token) {
        const [_admin] = await AdminModel.getAdminById(admin.id);
        const existingToken = _admin?.token || [];
        if (existingToken.length >= MaxConcurrentLoginLimit) {
            throw new ClientError(`Kindly log out from one of your devices, as you have reached the maximum allowable limit of ${MaxConcurrentLoginLimit} simultaneous logins.`);
        }
        existingToken.push(token);
        const { rows } = await AdminModel.updateOneById({ token: existingToken }, admin.id);
        return true;
    }

    static async logout(data) {
        const { user, authorization } = data;
        let token = authorization;
        if (token.startsWith("Bearer")) {
            token = token.substring("Bearer ".length);
        }

        const [admin] = await AdminModel.getAdminById(user);
        let allTokens = admin.token || [];
        allTokens = allTokens.filter(t => t?.toString().trim() != token.trim());
        const { rows } = await AdminModel.updateOneById({ token: allTokens }, admin.id);

        return {
            msg: "Logout successful"
        }
    }

    /**
    * get admin list
    * @param {string} body - pagination values.
    */
    static async getAdminList(body) {
        let {
            page,
            page_size,
            is_paginated,
            sort_by,
            order,
            keyword,
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

        const response = await AdminModel.subAdminList({
            sort,
            limit,
            offset,
            keyword,
        })

        return {
            count: response?.count || 0,
            rows: response?.rows?.map(elem => {
                const newElem = { ...elem, ...elem.contact_info };
                delete newElem.contact_info;

                // Handle empty role array
                if (newElem.role && Array.isArray(newElem.role)) {
                    newElem.role = newElem.role.filter(r => r !== null);
                }

                return newElem;
            }) || []
        };

    }

    static async loginSubAdmin(body) {
        let { email, password } = body;

        email = getTrimmedValue(email);

        const [existAdmin] = await AdminModel.getAdminByEmail(email);
        if (!existAdmin) {
            throw new ClientError("Invalid Email. User does not exists with this email")
        }

        const userRole = await UserRoleModel.findRoleDetailsByUserId(existAdmin.id);

        if (!userRole) {
            throw new ClientError("User Role not found");
        }

        const isPassMatched = await comparePass(password, existAdmin.password);
        if (!isPassMatched) throw new ClientError("Password does not match");
        const token = await AuthService.userToToken(existAdmin.id);
        const permissions = {};
        for (let role of userRole) {
            const permission = await AuthService.getPermissionByRoleKey(role.role_key);
            permissions[role.role_key] = permission;
        }

        await AuthService.updateAdminTokenForLogin(existAdmin, token);
        //updating user permission for role
        await AuthService.updateRolePermission(userRole.map(elem => elem.role_key), true);
        return {
            msg: 'Admin Logged In',
            role: userRole,
            token,
            permissions
        }
    }

    static async updateRolePermission(userRoleKeys, forceUpdate = false) {
        if (isEmptyField(userRoleKeys)) throw new ServerError("userRole cannot be empty");
        if (!Array.isArray(userRoleKeys)) userRoleKeys = [userRoleKeys];

        for (let roleKey of userRoleKeys) {
            const rolePermissionKey = AuthService.getRolePermissionKey(roleKey);
            let rolePermissionData = await getData(rolePermissionKey);
            if (!rolePermissionData || forceUpdate) {
                rolePermissionData = await AuthService.getPermissionByRoleKey(roleKey);
                await setDataNoTtl(rolePermissionKey, rolePermissionData);
            }
        }
    }

    static async getPermissionByRoleKey(roleKey) {
        if (roleKey == SUPER_ADMIN_ROLE) {
            const modules = await ModulesModel.getAllModuleNames();
            const permission = {};
            for (let module of modules) {
                permission[module.name] = [CREATE, READ, UPDATE, DELETE]
            }
            return permission;
        }
        const [rolePermission] = await UserRoleModel.getRolePermissionByRoleKey(roleKey) || [];
        if (!rolePermission) return {};
        return groupByField(rolePermission.permissions, 'module_name');
    }

    static getRolePermissionKey(roleKey) {
        return `permission_${roleKey}`;
    }

    static async updateAdmin(body) {
        let { name, email, password, role_id, id, dbTransaction } = body;

        email = getTrimmedValue(email);
        const [existAdmin] = await AdminModel.getAdminById(id, dbTransaction);

        if (!existAdmin) {
            throw new ClientError("No user found");
        }

        const updateObject = {};

        if (!isEmptyField(role_id)) {
            const [role] = await RoleModel.findOneByuId(role_id, dbTransaction);
            if (!role) {
                throw new ClientError("Role not found")
            }

            if (role.role_key == SUPER_ADMIN_ROLE) throw new ClientError("Super admin role cannot be assigned. Please choose different role");

            const [isUserRoleExist] = await UserRoleModel.checkIfUserRoleExist(existAdmin.id, role.id);
            !isUserRoleExist ? await UserRoleService.add({ user_id: existAdmin.id, _role_id: role.id, dbTransaction })
                : await UserRoleService.update({ id: isUserRoleExist.uid, user_id: existAdmin.id, role_id: role_id, dbTransaction });
        }

        if (!isEmptyField(name)) {
            updateObject['contact_info'] = {
                ...existAdmin.contact_info,
                name: name || existAdmin.name,
            };
        }

        if (!isEmptyField(email)) {
            const [existDuplicateAdmin] = await AdminModel.getAdminByEmail(email, dbTransaction);

            if (existDuplicateAdmin && existDuplicateAdmin.id != existAdmin.id) {
                throw new ClientError(`An user already exist with email - ${email}`);
            }
            updateObject['email'] = email;
        }

        if (!isEmptyField(password)) {
            const hashedPass = await hashPass(password);
            updateObject['password'] = hashedPass;
        }

        if (Object.keys(updateObject).length < 1) throw new ClientError("No data to update");

        const { rows } = await AdminModel.updateOneById(updateObject, existAdmin.id, dbTransaction);

        if (rows < 1) {
            throw new ClientError("Unable to update admin");
        }

        return {
            msg: 'Admin data updated',
        }
    }

    static async getPermissions(body) {
        const { user } = body;
        const userRole = await UserRoleModel.findRoleDetailsByUserId(user);

        if (!userRole) {
            throw new ClientError("User Role not found");
        }

        const permissions = {};
        for (let role of userRole) {
            const permission = await AuthService.getPermissionByRoleKey(role.role_key);
            permissions[role.role_key] = permission;
        }
        return permissions;
    }
}

module.exports = AuthService;
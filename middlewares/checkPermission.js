const { SUPER_ADMIN_ROLE } = require("../constants/roles");
const ClientError = require("../error/clientError");

function checkUserPermission(module, modulePermissions) {
    return (request, reply, done) => {
        try {
            console.log("module ************* ", module);
            console.log("module required permissions ************* ", modulePermissions);
            const isSuperAdminUser = request?.role_of_user == SUPER_ADMIN_ROLE;
            if (isSuperAdminUser) {
                done();
            } else {
                if (!Array.isArray(modulePermissions)) modulePermissions = [modulePermissions];
                const rolePermission = request?.role_permission || {};
                const userPermission = rolePermission[module] || [];
                console.log("user has permission ************* ", userPermission);
                if (!userPermission) {
                    throw new ClientError("You're not authorized to access this")
                }

                const hasPermission = modulePermissions.every(permission => userPermission.includes(permission));

                if (!hasPermission) {
                    throw new ClientError("You're not authorized to access this");
                }
                done();
            }
        } catch (err) {
            done(err)
        }
    }
}

module.exports = checkUserPermission
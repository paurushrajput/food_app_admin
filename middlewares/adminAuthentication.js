const { readJwt } = require("../utils/jwt");
const AdminAuthModel = require("../models/mysql/admin.model");
const ClientError = require("../error/clientError");
const { invalidTokenCode } = require("../constants/statusCode");
const { getData } = require("../dbConfig/redisConnect");
const AuthService = require("../services/admin/auth.service");

const adminAuth = async (request, reply, done) => {
  try {
    const authHeader = request.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ClientError("Invalid or missing authorization header", { statusCode: invalidTokenCode });
    }

    const token = authHeader.substring("Bearer ".length);
    const decoded = await readJwt(token);

    if (!decoded || !decoded.admin_id) {
      throw new ClientError("Invalid token provided", { statusCode: invalidTokenCode });
    }

    const [admin] = await AdminAuthModel.getAdminDetailsId(decoded.admin_id);
    if (!admin) {
      throw new ClientError("Invalid token provided", { statusCode: invalidTokenCode });
    }
    const allToken = admin.token || [];
    const currentToken = allToken.find(t => t?.toString().trim() == token.trim());
    if (!currentToken || currentToken == "" || currentToken == null) {
      throw new ClientError("Invalid token provided", { statusCode: invalidTokenCode });
    }
    request.user = decoded.admin_id;
    const rolePermissionKey = AuthService.getRolePermissionKey(admin.role_key);
    const permissions = await getData(rolePermissionKey)
    // fetch role_permission and attach it to request object
    request.role_permission = permissions;
    request.role_of_user = admin.role_key;
    request.user = decoded.admin_id;
  } catch (err) {
    done(err);
  }
};

module.exports = adminAuth;

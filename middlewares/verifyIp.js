const { readJwt } = require("../utils/jwt");
const AdminAuthModel = require("../models/mysql/admin.model");
const ClientError = require("../error/clientError");
const { invalidTokenCode } = require("../constants/statusCode");

const verifyIP = async (request, reply, done) => {
  if(process.env.SERVER_IP != request.headers?.x_forwarded_for)
    throw new ClientError("Invalid IP");
};

module.exports = verifyIP;

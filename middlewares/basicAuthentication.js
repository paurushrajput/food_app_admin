const { readJwt } = require("../utils/jwt");
const UsersModel = require("../models/mysql/users.model");
const ClientError = require("../error/clientError");
const { getData } = require("../dbConfig/redisConnect");
const { decodeString, encodeString } = require("../utils/common");

const authenticate = async (request, reply, done) => {
  let token = request.headers["authorization"] || "";
  if (!token) {
    throw new ClientError("Invalid or missing authorization header");
  }

  if (!token || token === "" || !token.startsWith("Basic ")) {
    throw new ClientError("Invalid or missing authorization header");
  }

  token = token.substring("Basic ".length);

  const userName = process.env.AUTH_USERNAME;
  const password = process.env.AUTH_PASSWORED;

  const encodedString = encodeString(`${userName}:${password}`);

  if(encodedString !== token){
    throw new ClientError("Invalid or missing authorization header");
  }
};

module.exports = authenticate;
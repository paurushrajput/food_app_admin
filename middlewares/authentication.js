const { readJwt } = require("../utils/jwt");
const UsersModel = require("../models/mysql/users.model");
const ClientError = require("../error/clientError");
const { getData } = require("../dbConfig/redisConnect");

const authenticate = async (request, reply, done) => {
  try {
    const token = request.headers["token"];
    if (!token) {
      throw new ClientError("Invalid token provided");
    }

    const decoded = await readJwt(token);

    const [user] = await UsersModel.findUserWithUid(decoded.user_id);

    if (!user || user.status == 0) {
      throw new ClientError("Invalid token provided");
    }

    const redisUserData = await getData(user.uid);
    if (String(redisUserData.token) !== String(token)) {
      throw new ClientError("Invalid token provided");
    }

    request.user = redisUserData.user;

    done();
  } catch (err) {
    done(err)
  }
};

module.exports = authenticate;
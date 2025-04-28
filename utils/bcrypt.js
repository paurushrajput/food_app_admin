const bcrypt = require("bcrypt");
const ServerError = require("../error/serverError");
const ClientError = require("../error/clientError");

// async function hashPass(password) {
//   const saltRounds = 10;

//   return new Promise((resolve, reject) => {
//     bcrypt.hash(password, saltRounds, function (err, hash) {
//       if (err) reject(err);
//       resolve(hash);
//     });
//   });
// }

// async function comparePass(password, hashPass) {
//   return new Promise((resolve, reject) => {
//     bcrypt.compare(password, hashPass, function (err, res) {
//       if (err) {
//         resolve({
//           status: false,
//           msg: "Unable to match password"
//         })
//       } else if (res === true) {
//         resolve({
//           status: true,
//           msg: "password matched"
//         })
//       } else {
//         resolve({
//           status: false,
//           msg: "Password does not match"
//         })
//       }
//     });
//   });
// }

async function hashPass(password) {
  try{
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
  } catch (err){
    throw new ServerError(err);
  }
}

async function comparePass(password, hashPass) {
  try{
    const res = await bcrypt.compare(password, hashPass);
    if (res === true) return true;
    else return false;
  } catch(err){
    throw new ServerError(err);
  }
}

module.exports = {
  hashPass,
  comparePass
}
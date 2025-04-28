const ClientError = require("../error/clientError");
const { verifyHeaders } = require("../utils/requestHeaders");
const { Logins } = require("../constants/database");

function headersValidators(considerOptionalVariables = true) {
   return (request, reply, done) => {
      try {
         const headersKey = Object.keys(request.headers);
         for (let hk of headersKey) {
            if (hk.toString().includes('-')) {
               const newKey = hk.replace(/-/g, '_');
               request.headers[newKey] = request.headers[hk];
               delete request.headers[hk];
            }
         }
         const missingVariables = verifyHeaders(request.headers, considerOptionalVariables);
         if (missingVariables.length > 0) {
            throw new ClientError(`${missingVariables.toString().replace(/_/g, '-')} are not found in headers.`);
         }
         const deviceTypeKeyName = "device_type";
         const deviceTypeValue = request.headers["device_type"];
         const permittedDeviceTypeValue = Object.values(Logins.DeviceType);
         if (!permittedDeviceTypeValue.includes(deviceTypeValue)) {
            throw new ClientError(`Invalid value of ${deviceTypeKeyName.replace("_","-")} found in headers. It value should be any of the ${permittedDeviceTypeValue.toString()}`);
         }
         done();
      } catch (err) {
         done(err)
      }
   }
}

module.exports = headersValidators;
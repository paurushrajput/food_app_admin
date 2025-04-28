const ClientError = require("../error/clientError");
const { verifyAdminHeaders } = require("../utils/requestHeaders");

function adminHeadersValidators() {
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
         const missingVariables = verifyAdminHeaders(request.headers);
         if (missingVariables.length > 0) {
            throw new ClientError(`${missingVariables.toString().replace(/_/g, '-')} are not found in headers.`);
         }
         done();
      } catch (err) {
         done(err)
      }
   }
}
module.exports = adminHeadersValidators;
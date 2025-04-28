const ClientError = require("../error/clientError");
const { GetDynamicLinkUrl, DomainUriPrefix, DomainUrl, PackageName, PackageNameIOS, WebApiKeyForDynamicUrl, IosAppId } = require("../constants/firebase");
const { post } = require("../utils/fetch");

async function getDynamicShareLink(referralCode,userid) {
    try {
      const link = `${DomainUrl}?referral_code=${referralCode}`;
      const payload = {
        url: `${GetDynamicLinkUrl}?key=${WebApiKeyForDynamicUrl}`,
        body: {
          longDynamicLink: `${DomainUriPrefix}/?link=${link}&apn=${PackageName}&isi=${IosAppId}&ibi=${PackageNameIOS}`,
        }
      }
      const {data: {shortLink = ""}} = await post(payload);
      return { shortLink,userid }
    } catch (error) {
        throw new ClientError(error.response.data.error)
    }
}

module.exports = {
  getDynamicShareLink
}
const GetDynamicLinkUrl = 'https://firebasedynamiclinks.googleapis.com/v1/shortLinks';
const DomainUriPrefix = 'https://nukhba.page.link';
const PackageName = 'com.cuisine.nukbha'; //com.food.nukbha
const PackageNameIOS = 'com.food.nukbha'; //com.food.nukbha
const WebApiKeyForDynamicUrl = process.env.DYNAMIC_URL_WEB_API_KEY
const IosAppId = '6471836873';
const DomainUrl = 'https://www.nukhba.com'

module.exports = {
  GetDynamicLinkUrl,
  DomainUriPrefix,
  PackageName,
  PackageNameIOS,
  WebApiKeyForDynamicUrl,
  IosAppId,
  DomainUrl
}
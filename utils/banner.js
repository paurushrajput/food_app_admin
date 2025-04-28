const BannerModel = require("../models/mysql/banner.model")
const {setData , getData , delData , setDataNoTtl} = require("../dbConfig/redisConnect")
const ServerError = require("../error/serverError");


async function createBannerRedisData(appType) {
    try {
      const keyForBanner = `banner_${appType}`;
      const bannerResp = await BannerModel.getBannerByappType(appType);
      await delData([keyForBanner]);
      await setDataNoTtl(keyForBanner, bannerResp.data || []);
    } catch (err) {
      return { success: false, msg: err.message };
    }
  }

module.exports = {
    createBannerRedisData
}
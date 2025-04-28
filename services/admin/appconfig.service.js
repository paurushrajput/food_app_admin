const AppConfig = require("../../models/mysql/appconfig.model");
const ClientError = require("../../error/clientError");
const { Bit } = require("../../constants/database");
const { ANDROID_UPDATE, IOS_UPDATE, GUEST_USER_WHITELIST_API } = require("../../constants/variables");
const ServerError = require("../../error/serverError");
const { setDataNoTtl } = require("../../dbConfig/redisConnect");
const { APP_CONFIG_TITLE } = require("../../constants/database");
const { isEmptyField } = require("../../utils/common");
const { WALLET_EARN_METHODS } = require("../../constants/appConfig");
const MediaModel = require("../../models/mysql/media.model");
const { getUrlFromBucket } = require("../../utils/s3");

class AppConfigService {

    /**
     * insert data
     * @param {string} body -app config data
    */

    static async insertData(body) {
        const { value, title } = body;
        const checkData = await AppConfig.getByValue(title);
        if (checkData.length > 0)
            throw new ClientError("Title is already exist");
        if (!value) throw new ClientError("value not provided")
        const appData = await AppConfig.insert({ value: value, title: title });
        return appData;
    }

    /**
     * change status
     * @param {string} body - uid 
     */
    static async changeStatus(body) {
        const { uid } = body;
        const getConfig = await AppConfig.getOneByuId(uid);
        if (!getConfig) throw new ClientError("details not found for this uid")
        const response = await AppConfig.updateOneById({ status: Bit.zero }, getConfig[0].id);
        return response;
    }

    /**
     * list all
     * @param {string} - status
     */
    static async list(body) {
        const { status, title } = body;
        const getData = await AppConfig.listAll({ status, title });
        if (!getData) throw new ClientError("data not found");
        if(!isEmptyField(title)){
            return getData[0]
        }
        return getData;
    }

    /**
     * update app config
     * @param {string} - body 
     */
    static async updateAppConfig(body) {
        const { value, override = false, status, uid, title } = body;
        const [getConfig] = await AppConfig.getOneByuId(uid);
        if (!getConfig) throw new ClientError("details not found for this uid")
        const updateObj = {};

        //update image
        if(title === WALLET_EARN_METHODS ){

            const earn_methods = value?.data
            for(let i = 0; i < earn_methods?.length ; i++){
                const item = earn_methods[i]
                if(!item?.icon?.includes('https://')){
                    const mediaId = item.icon
                    // get filename from media id
                    const [mediaRes] = await MediaModel.getOneByUId(mediaId)
                    const filename = mediaRes?.basePath + '/' + mediaRes?.filename
                    item.icon = getUrlFromBucket(filename)
                }
            }
        }

        let response;
        if (value) {
            if(!override)
                updateObj['value'] = {...getConfig.value, ...value}
            else
                updateObj['value'] = value;
        }
        if (status) {
            updateObj['status'] = status;
        }
        if (title) {
            updateObj['title'] = title;
        }

        response = await AppConfig.updateOneById(updateObj, getConfig.id);
        if (response.rows != 1) {
            throw new ServerError("Unable to update app config")
        }
        if (getConfig.title.toString().trim().toLowerCase() == GUEST_USER_WHITELIST_API.toString().trim().toLowerCase()) {
            await setDataNoTtl(GUEST_USER_WHITELIST_API, value);
        }
        return response;
    }

    static async updateAppVersion(data) {
        const { config_id, value, user } = data;
        const [appconfig] = await AppConfig.getOneByuId(config_id);
        if (!appconfig) {
            throw new ClientError("Invalid config_id");
        }

        let newValue = appconfig.value || {};
        newValue = { ...newValue, updated_by: user.id, ...value };
        await AppConfig.updateAppVersion(newValue, appconfig.id);
        return {
            msg: `${appconfig.title} has been updated successfully`
        }
    }

    static async getAppConfigByTitle(data) {
        const appconfig = await AppConfig.getAppConfigByTitle([ANDROID_UPDATE, IOS_UPDATE]);
        return {
            appconfig: appconfig?.map(config => ({
                ...config,
                title: config.title == ANDROID_UPDATE ? 'Android' : 'iOS',
            }))
        }
    }

}

module.exports = AppConfigService;
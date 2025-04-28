const ClientError = require("../../error/clientError");
const DatabaseError = require("../../error/databaseError");
const AppSettingsModel = require("../../models/mysql/appSettings.model");
const MediaModel = require("../../models/mysql/media.model");
const { getUrlFromBucket } = require("../../utils/s3");

class AppSettingsService {

    static async addAppSettings(data) {
        const { title, image, description, url, user } = data;

        const appSetting = {
            title,
            alternate_id: title.replace(/ /g, "_").toLowerCase(),
            description,
            url,
        };

        let imageId;
        if (image) {
            imageId = await AppSettingsService.imageValidation(image);
        }
        const [existingAppSetting] = await AppSettingsModel.findMaxRank();
        appSetting.sequence = Number(existingAppSetting.sequence) + 1;

        try {
            const { rows } = await AppSettingsModel.insert({ ...appSetting, image: imageId });
            if (rows != 1) {
                throw new GeneralError('Unable to add app settings');
            }
            return {
                msg: "App settings added successfully"
            };
        } catch (err) {
            if (err instanceof DatabaseError) {
                return {
                    msg: err?.message?.toString()
                };
            }
            throw err;
        }
    }

    static async updateAppSettings(data) {
        const { settings_id, title, image, description, url, user } = data;

        await AppSettingsService.updateCheck(data);

        const [existingAppSetting] = await AppSettingsModel.findOneByuId(settings_id);

        if (!existingAppSetting) {
            throw new ClientError("Invalid settings_id")
        }

        const appSetting = {
            title: title || existingAppSetting.title,
            description,
            url,
        };

        let imageId;
        if (image) {
            imageId = await AppSettingsService.imageValidation(image);
        }

        try {
            const { rows } = await AppSettingsModel.updateOneById({ ...appSetting, image: imageId }, existingAppSetting.id);
            if (rows != 1) {
                throw new GeneralError('Unable to update app settings');
            }
            return {
                msg: "App settings updated successfully"
            };
        } catch (err) {
            if (err instanceof DatabaseError) {
                return {
                    msg: err?.message?.toString()
                };
            }
            throw err;
        }
    }

    static async updateAppSettingsBulk(data) {
        const { app_settings, user } = data;

        const appSettings = await AppSettingsService.appSettingsValidationAndEnhancement(app_settings);
        try {
            for (let appSetting of appSettings) {
                const id = appSetting.id;
                delete appSetting.id;
                await AppSettingsModel.updateOneById(appSetting, id);
            }
            return {
                msg: "App settings updated successfully"
            };
        } catch (err) {
            if (err instanceof DatabaseError) {
                return {
                    msg: err?.message?.toString()
                };
            }
            throw err;
        }
    }

    static async getAndFilterAppSettings(data) {
        let {
            page = 1,
            page_size = 10,
            is_paginated = false,
            sort_by = 'aps.sequence',
            order = 'asc',
            title,
        } = data;

        const sort = `${sort_by} ${order}`;
        const limit = Number(page_size);
        const offset = (Number(page) - 1) * Number(page_size);
        const response = await AppSettingsModel.listSettings({ sort, offset, limit, is_paginated, title });

        return {
            count: response.count,
            rows: response.rows?.map(elem => {
                return {
                    ...elem,
                    image: getUrlFromBucket(elem.image),
                }
            }),
        };
    }

    static async deleteAppSetting(data) {
        const { settings_id, user } = data;
        const [existingAppSetting] = await AppSettingsModel.findOneByuId(settings_id);

        if (!existingAppSetting) {
            throw new ClientError("Invalid settings_id")
        }

        const { rows } = await AppSettingsModel.updateOneById({ deleted_at: "CURRENT_TIMESTAMP" }, existingAppSetting.id);
        if (rows != 1) {
            throw new GeneralError('Unable to delete app settings');
        }
        return {
            msg: "App Settings deleted successfully"
        };
    }

    static async imageValidation(image) {
        const [imageMedia] = await MediaModel.checkIfIdsExist(image) || [];
        if (!imageMedia) {
            throw new ClientError("Invalid image")
        }
        return imageMedia.id
    }

    static hasSameRanking(array) {
        const rankSet = new Set();

        for (const item of array) {
            if (rankSet.has(item.sequence)) {
                return true; // Found an element with the same rank
            } else {
                rankSet.add(item.sequence);
            }
        }
        return false; // No elements with the same rank
    }

    static async updateCheck({ title, image, description, url }) {
        if (!title && !image && !description && !url) {
            throw new ClientError("Please provide title or image or description or url or all in order to update app settings")
        }
    }

    static async appSettingsValidationAndEnhancement(appSettings = []) {

        if (appSettings.length < 1) {
            throw new ClientError("app_settings cannot be an empty array")
        }

        //accumlating all the settings_id
        const settingsIdArr = appSettings.map(appSetting => appSetting.id);

        //checking if each of the settings exist on database or not
        const existingSettings = await AppSettingsModel.checkIfIdsExist(settingsIdArr) || [];

        for (let s = 0; s < appSettings.length; s++) {
            const existingSetting = existingSettings.find(elem => elem.uid == appSettings[s].id);
            if (!existingSetting) {
                throw new ClientError(`App settings with id ${appSettings[s].id} does not exists`);
            }
            appSettings[s].id = existingSetting.id;
        }

        //checking if the appSettings has same rank of not
        if (AppSettingsService.hasSameRanking(appSettings)) {
            throw new ClientError("Duplicate sequence found inside appSettings")
        }

        //accumulating all the image ids received in appSettings
        let imageArr = appSettings.map(elem => elem.image) || [];
        imageArr = imageArr.filter(elem => typeof elem != "undefined");

        let imageMedia = []

        if (imageArr.length > 0) {
            const imageUniqueArr = [...new Set(imageArr)];

            //checking if any element of appSettings consists of duplicate image
            if (imageArr.length != imageUniqueArr.length) {
                throw new ClientError("Images inside appSettings consists of duplicate image")
            }

            //finding those image ids in our database
            imageMedia = await MediaModel.checkIfIdsExist(imageArr) || []

            //checking if all the received image ids exists in our database or not
            if (imageMedia.length != imageArr.length) {
                const invalidImageIds = [];

                //finding all the non-existing image ids
                for (let img of imageArr) {
                    const imageExist = imageMedia.find(elem => elem.uid == img)
                    if (!imageExist) {
                        invalidImageIds.push(img);
                    }
                }
                throw new ClientError(`These images ${invalidImageIds.toString()} are not found in our database`);
            }
        }

        //all good, manipulating breakup
        for (let b = 0; b < appSettings.length; b++) {
            await AppSettingsService.updateCheck(appSettings[b]);
            if (imageMedia.length > 0) {
                const imageInDb = imageMedia?.find(elem => elem.uid == appSettings[b].image);
                if (imageInDb) {
                    appSettings[b].image = imageInDb.id;
                }
            }
        }

        return appSettings;
    }
}

module.exports = AppSettingsService;
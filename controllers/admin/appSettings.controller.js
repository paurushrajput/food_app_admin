const AppSettingsService = require("../../services/admin/appSettings.service");
const RequestHandler = require("../../utils/requestHandler");

class AppSettingsController {

    static async addAppSettingsHandler(request, reply) {
        const validData = request.userInput;
        const data = await AppSettingsService.addAppSettings(validData);
        return RequestHandler.successHandler(request, reply, data);
    }

    static async updateAppSettingsHandler(request, reply) {
        const validData = request.userInput;
        const data = await AppSettingsService.updateAppSettings(validData);
        return RequestHandler.successHandler(request, reply, data)
    }

    static async updateAppSettingsBulkHandler(request, reply) {
        const validData = request.userInput;
        const data = await AppSettingsService.updateAppSettingsBulk(validData);
        return RequestHandler.successHandler(request, reply, data)
    }

    static async getAndFilterAppSettingsHandler(request, reply) {
        const validData = request.userInput;
        const data = await AppSettingsService.getAndFilterAppSettings(validData);
        return RequestHandler.successHandler(request, reply, data)
    }

    static async deleteAppSettingHandler(request, reply) {
        const validData = request.userInput;
        const data = await AppSettingsService.deleteAppSetting(validData);
        return RequestHandler.successHandler(request, reply, data)
    }
}

module.exports = AppSettingsController;
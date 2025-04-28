const AppConfigService = require("../../services/admin/appconfig.service");
const RequestHandler = require("../../utils/requestHandler");

class AppConfigController {
    static async insertAppConfigHandler(request, reply){
        const validData = request.userInput;
        const data =  await AppConfigService.insertData(validData);
        return RequestHandler.successHandler(request , reply , data)
    }
    
    static async updateAppConfigHandler(request , reply){
        const validData = request.userInput;
        const data =  await AppConfigService.updateAppConfig(validData);
        return RequestHandler.successHandler(request, reply , data);
      }

      static async changeStatusAppConfigHandler(request , reply){
        const validData = request.userInput;
        const data =  await AppConfigService.changeStatus(validData);
        return RequestHandler.successHandler(request, reply , data);
      }

      static async listAppConfigHandler(request , reply){
        const validData = request.userInput;
        const data =  await AppConfigService.list(validData);
        return RequestHandler.successHandler(request, reply , data);
      }

      static async updateAppVersionHandler(request , reply){
        const validData = request.userInput;
        const data =  await AppConfigService.updateAppVersion(validData);
        return RequestHandler.successHandler(request, reply , data);
      }

      static async getAppVersionHandler(request , reply){
        const validData = request.userInput;
        const data =  await AppConfigService.getAppConfigByTitle(validData);
        return RequestHandler.successHandler(request, reply , data);
      }
    }
module.exports = AppConfigController;
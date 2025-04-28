const AuthService = require("../../services/admin/auth.service");
const RequestHandler = require("../../utils/requestHandler");

class AuthController {
    static async loginHandler(request, reply){
        const userInput = request.userInput;
        const data = await AuthService.login(userInput);
        return RequestHandler.successHandler(request, reply , data);
    }

    static async createHandler(request, reply){
        const userInput = request.userInput;
        const data = await AuthService.create(userInput);
        return RequestHandler.successHandler(request, reply , data);
    }

    static async updateAdminHandler(request, reply){
        const userInput = request.userInput;
        const data = await AuthService.updateAdmin(userInput);
        return RequestHandler.successHandler(request, reply , data);
    }

    static async addContactInfoHandler(request, reply){
        const userInput = request.userInput;
        const data = await AuthService.addContactInfo(userInput);
        return RequestHandler.successHandler(request, reply , data);
    }

    static async getContactInfoHandler(request, reply){
        const userInput = request.userInput;
        const data = await AuthService.getContactInfo(userInput);
        return RequestHandler.successHandler(request, reply , data);
    }

    static async logoutHandler(request, reply){
        const userInput = request.userInput;
        const data = await AuthService.logout(userInput);
        return RequestHandler.successHandler(request, reply , data);
    }

    static async getAdminListHandler(request, reply){
        const userInput = request.userInput;
        const data = await AuthService.getAdminList(userInput);
        return RequestHandler.successHandler(request, reply , data);
    }

    static async getPermissionsHandler(request, reply){
        const userInput = request.userInput;
        const data = await AuthService.getPermissions(userInput);
        return RequestHandler.successHandler(request, reply , data);
    }
}

module.exports = AuthController;
const LocationService = require("../../services/admin/location.service");
const RequestHandler = require("../../utils/requestHandler");

class LocationController {
    static async updateCountryStatusHandler(request, reply) {
      const validData = request.userInput;
      const data = await LocationService.updateCountryStatus(validData);
      return RequestHandler.successHandler(request, reply, data);
    }

    static async updateStateStatusHandler(request, reply) {
      const validData = request.userInput;
      const data = await LocationService.updateStateStatus(validData);
      return RequestHandler.successHandler(request, reply, data);
    }

    static async updateCityStatusHandler(request, reply) {
      const validData = request.userInput;
      const data = await LocationService.updateCityStatus(validData);
      return RequestHandler.successHandler(request, reply, data);
    }

    static async getlocationListHandler(request,reply) {
      const validData = request.userInput;
      const data = await LocationService.getLocationList(validData);
      return RequestHandler.successHandler(request, reply, data)
    }

    static async insertLocationHandler(request, reply){
      const validData = request.userInput;
      const data =  await LocationService.insertLocation(validData);
      return RequestHandler.successHandler(request , reply , data)
    }

    static async updateLocationHandler(request , reply){
      const validData = request.userInput;
      const data =  await LocationService.updateLocation(validData);
      return RequestHandler.successHandler(request, reply , data);
    }

    static async getAllCountryHandler(request, reply){
      const validData = request.userInput;
      const data =  await LocationService.getAllCountries(validData);
      return RequestHandler.successHandler(request, reply , data);
    }

    static async getCityByCountryId(request, reply){
      const validData = request.userInput;
      const data =  await LocationService.getCitiesListbyCountryId(validData);
      return RequestHandler.successHandler(request, reply , data);
    }
}

module.exports = LocationController;
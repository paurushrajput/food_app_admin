const LocationService = require("../../services/users/location.service");
const RequestHandler = require("../../utils/requestHandler");

class LocationController {
  static async getCountryListHandler(request, reply) {
    const validData = request.userInput;
    const data = await LocationService.getCountryList(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getStateListHandler(request, reply) {
    const validData = request.userInput;
    const data = await LocationService.getStateList(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getCitiesByCountryHandler(request, reply) {
    const validData = request.userInput;
    const data = await LocationService.getCitiesByCountry(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async updateUserLocationHandler(request, reply) {
    const validData = request.userInput;
    const data = await LocationService.updateUserLocation(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getLocationRestaurantHandler(request, reply) {
    const userInput = request.userInput;
    const data = await LocationService.getRestaurantsByLocation(userInput);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async getLocationRestaurantAllDataHandler(request, reply) {
    const userInput = request.userInput;
    const data = await LocationService.getRestaurantsByLocationAndRestaurant(userInput);
    return RequestHandler.successHandler(request, reply, data);
  }
}

module.exports = LocationController;

// do not use try catch anywhere in this file;
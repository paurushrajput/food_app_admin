const AmenitiesService = require("../../services/admin/amenities.service");
const RequestHandler = require("../../utils/requestHandler");

class AmenitiesController {
  static async getAmenitiesListHandler(request, reply) {
    const validData = request.userInput;
    const data = await AmenitiesService.getAmenitiesList(validData);
    return RequestHandler.successHandler(request, reply, data);
  }

  static async addAmenitiesHandler(request, reply){
    const validData = request.userInput;
    const data =  await AmenitiesService.addAmenities(validData);
    return RequestHandler.successHandler(request , reply , data)
  }

  static async updateAmenitiesHandler(request,reply) {
    const validData = request.userInput;
    const data = await AmenitiesService.updateAmenities(validData);
    return RequestHandler.successHandler(request, reply, data)
  }
}

module.exports = AmenitiesController;
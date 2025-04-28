const CategoryService = require("../../services/admin/category.service");
const RequestHandler = require("../../utils/requestHandler");

class CategoryController {
    static async updateCategoryHandler(request , reply){
        const validData = request.userInput;
      const data = await CategoryService.updateCategory(validData);
      return RequestHandler.successHandler(request, reply, data);
    }

    static async insertCategoryHandler(request, reply){
        const validData = request.userInput;
        const data =  await CategoryService.insertCategory(validData);
        return RequestHandler.successHandler(request , reply , data)
      }

      static async getCategoryListHandler(request,reply) {
        const validData = request.userInput;
        const data = await CategoryService.getCategoryList(validData);
        return RequestHandler.successHandler(request, reply, data)
      }

      static async updateSequenceHandler(request, reply) {
        const validData = request.userInput;
        const data = await CategoryService.updateSequence(validData);
        return RequestHandler.successHandler(request, reply, data);
      }
}

module.exports = CategoryController;
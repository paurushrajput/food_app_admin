const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const CategoryController = require("../../controllers/admin/category.controller");
const { categoryList, insertCategory, update, updateSequence } = require('../../schemas/admin/category.schema');
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { CATEGORY } = require("../../constants/modules");
const moduleName = CATEGORY;

const categoryRoute = [
    {
        method: 'GET',
        url: '/categories',
        schema: categoryList,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(CategoryController.getCategoryListHandler),
    },
    {
        method: 'POST',
        url: '/categories',
        schema: insertCategory,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
        handler: asyncRouteHandler(CategoryController.insertCategoryHandler),
    },
    {
        method: 'PUT',
        url: '/categories/:uid',
        schema: update,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(CategoryController.updateCategoryHandler)
    },
    {
        method: 'PUT',
        url: '/categories/update-sequence',
        schema: updateSequence,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(CategoryController.updateSequenceHandler, true),
    },

];
module.exports = categoryRoute;
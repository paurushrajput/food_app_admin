const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const DealController = require("../../controllers/admin/deal.controller");
const DealOptionController = require("../../controllers/admin/dealOption.controller");
const { createDeal, updateDeal, dealList, deleteDeal, dealOptionList, deleteDealOption, userDealList, removeImage, updateDealSequence } = require("../../schemas/admin/deal.schema");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { DEAL } = require("../../constants/modules");
const moduleName = DEAL;

const dealRoute = [
  {
    method: 'POST',
    url: '/create',
    schema: createDeal,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
    handler: asyncRouteHandler(DealController.addDealHandler, true),
  },
  {
    method: 'PUT',
    url: '/update',
    schema: updateDeal,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(DealController.updateDealHandler, true),
  },
  {
    method: 'GET',
    url: '/list',
    schema: dealList,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(DealController.getDealListHandler),
  },
  {
    method: 'DELETE',
    url: '/delete',
    schema: deleteDeal,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [DELETE])],
    handler: asyncRouteHandler(DealController.deleteDealHandler),
  },
  {
    method: 'GET',
    url: '/option-list',
    schema: dealOptionList,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(DealOptionController.getDealOptionListHandler),
  },
  {
    method: 'DELETE',
    url: '/delete-option',
    schema: deleteDealOption,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [DELETE])],
    handler: asyncRouteHandler(DealOptionController.deleteDealOptionHandler),
  },
  {
    method: 'GET',
    url: '/user-deal-list',
    schema: userDealList,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(DealController.getUserDealListHandler),
  },
  {
    method: 'PUT',
    url: '/remove-images',
    schema: removeImage,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(DealController.removeImagesHandler),
  },
  {
    method: 'PUT',
    url: '/update-sequence',
    schema: updateDealSequence,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(DealController.updateDealSequenceHandler, true),
  },
  {
    method: 'PUT',
    url: '/deal-category-migration-script',
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(DealController.dealCategoryMigrationHandler, true),
  },
];

module.exports = dealRoute;
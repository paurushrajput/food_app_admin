const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const CampaignController = require("../../controllers/admin/campaign.controller");
const { get, add, update, deleteEntity } = require("../../schemas/admin/campaign.schema");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { CAMPAIGN } = require("../../constants/modules");
const moduleName = CAMPAIGN;

const campaignRoute = [
  {
    method: 'GET',
    url: '/get',
    schema: get,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
    handler: asyncRouteHandler(CampaignController.getHandler),
  },
  {
    method: 'POST',
    url: '/add',
    schema: add,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
    handler: asyncRouteHandler(CampaignController.addHandler),
  },
  {
    method: 'PUT',
    url: '/update',
    schema: update,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
    handler: asyncRouteHandler(CampaignController.updateHandler),
  },
  {
    method: 'DELETE',
    url: '/delete',
    schema: deleteEntity,
    preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [DELETE])],
    handler: asyncRouteHandler(CampaignController.deleteHandler),
  }
];

module.exports = campaignRoute;
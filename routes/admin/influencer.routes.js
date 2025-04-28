const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const adminAuth = require("../../middlewares/adminAuthentication");
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { INFLUENCER } = require("../../constants/modules");
const { getInfluencerList, approveInfluencer, updateInfluencer } = require("../../schemas/admin/influencer.schema");
const InfluencerController = require("../../controllers/admin/influencer.controller");
const moduleName = INFLUENCER;

const influencerRoute = [
    {
        method: 'GET',
        url: '/list',
        schema: getInfluencerList,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(InfluencerController.getInfluencersHandler),
    },
    {
        method: 'PUT',
        url: '/update-status',
        schema: approveInfluencer,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(InfluencerController.approveHandler,true),
    },
    {
        method: 'PUT',
        url: '/update',
        schema: updateInfluencer,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [UPDATE])],
        handler: asyncRouteHandler(InfluencerController.updateHandler,true),
    }
];


module.exports = influencerRoute;

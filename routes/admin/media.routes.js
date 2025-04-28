const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const { updateImage, mediaList } = require("../../schemas/admin/media.schema");
const MediaController = require("../../controllers/admin/media.controller");
const adminAuth = require("../../middlewares/adminAuthentication");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const { MEDIA } = require("../../constants/modules");
const moduleName = MEDIA;

const mediaRoute = [
    {
        method: 'POST',
        url: '/image',
        schema: updateImage,
        preHandler: [adminAuth, /*checkUserPermission(moduleName, [CREATE])*/],
        handler: asyncRouteHandler(MediaController.insertImageHandler),
    },
    {
        method: 'GET',
        url: '/image',
        // schema: updateImage,
        preHandler: [adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(MediaController.listImageHandler),
    },
    {
        method: 'GET',
        url: '/list',
        schema: mediaList,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(MediaController.listImageHandler),
    }
]
module.exports = mediaRoute;
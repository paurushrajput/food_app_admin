const asyncRouteHandler = require("../../middlewares/asyncRouteHandler");
const AgentController = require("../../controllers/admin/agent.controller");
const adminAuth = require("../../middlewares/adminAuthentication")
const adminHeadersValidators = require("../../middlewares/adminHeadersValidators");
const { addAgentSchema, listAgentSchema } = require("../../schemas/admin/agent.schema");
const checkUserPermission = require("../../middlewares/checkPermission");
const { READ, CREATE, UPDATE, DELETE } = require("../../constants/permission");
const { AGENT } = require("../../constants/modules");
const moduleName = AGENT;

const agentRoute = [
    {
        method: 'GET',
        url: '/list',
        schema: listAgentSchema,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [READ])],
        handler: asyncRouteHandler(AgentController.listAgentHandler),
    },
    {
        method: 'POST',
        url: '/add',
        schema: addAgentSchema,
        preHandler: [adminHeadersValidators(), adminAuth, checkUserPermission(moduleName, [CREATE])],
        handler: asyncRouteHandler(AgentController.addAgentHandler),
    },
];


module.exports = agentRoute;
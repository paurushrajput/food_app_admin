const { globalAPIPrefix, prefixToRemove } = require("../../constants/api");
const v1Prefix = `/${prefixToRemove}${globalAPIPrefix.v1}`;

const locationRoute = require("./location.routes");
const locationRoutePrefix = "/locations";


function userRoutes(server) {

    //locationsRoutes
    locationRoute.forEach((route) => {
        route.url = `${v1Prefix}${locationRoutePrefix}${route.url}`;
        server.route(route);
    });
}

module.exports = {
    userRoutes
}


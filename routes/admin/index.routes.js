const { globalAPIPrefix, prefixToRemove } = require("../../constants/api");
const v1Prefix = `/${prefixToRemove}${globalAPIPrefix.v1}/admin`;

const locationRoute = require("./location.routes");
const categoryRoute = require('./category.routes');

const authRoute = require("./auth.routes");

const merchantRoutePrefix = "/merchants";
const merchantRoute = require('./merchant.routes');

const userRoutePrefix = "/users";
const userRoute = require('./user.routes');

const agentRoutePrefix = "/agent";
const agentRoute = require('./agent.routes');

const mediaPrefix = "/media";
const mediaRoute = require('./media.routes');

const bannerprefix = "/banner";
const bannerRoute = require("./banner.routes")

const reviewsRoute = require("./reviews.routes");
const reviewsRoutePrefix = "/reviews";

const reservationRoute = require("./reservation.routes");
const reservationRoutePrefix = "/reservation";

const appConfigRoute = require("./appconfig.routes");
const appConfigRoutePrefix = "/app"

const restaurantRoute = require("./restaurant.routes");
const restaurantRoutePrefix = "/restaurant"

const notificationRoute = require("./notification.routes");
const notificationRoutePrefix = "/notifications"

const dinningRoute = require("./dinnings.routes");
const dinningRoutePrefix = "/dinnings"

const amenitiesRoute = require("./amenities.routes");
const amenitiesRoutePrefix = "/amenities"

const winnerBreakupRoutes = require("./winnerBreakup.routes");
const winnerBreakupRoutePrefix = "/winner-breakup"

const tournamentManifestRoutes = require("./tournamentManifest.routes");
const tournamentManifestPrefix = "/tournament-manifest"

const tournamentsRoute = require("./tournaments.routes");
const tournamentsRoutePrefix = "/tournaments"

const storiesRoute = require("./stories.routes");
const storiesRoutePrefix = "/stories"

const tournamentRuleRoute = require("./tournamentRules.routes");
const tournamentRulePrefix = "/tournament-rule"

const appSettingsRoute = require("./appSettings.routes");
const appSettingsRoutePrefix = "/app-settings"

const commissionPaymentHistoryRoute = require("./commissionPaymentHistory.routes");
const commissionPaymentHistoryRoutePrefix = "/commission-payments"

const deletedUserRoute = require("./deletedUser.routes");
const deletedUserRoutePrefix = "/deleted-users"

const paymentRoute = require("./payments.routes");
const paymentRoutePrefix = "/payments"

const couponRoute = require("./coupon.routes");
const couponRoutePrefix = "/coupons"

const nukhbaStoreRoute = require("./nukhbaStore.routes");
const nukhbaStoreRoutePrefix = "/nukhba-store"

const organizationRoute = require("./organization.routes");
const organizationRoutePrefix = "/organizations"

const notificationTemplateRoute = require("./notificationTemplate.routes");
const notificationTemplatePrefix = "/notification-template"

const dailyReportRoutePrefix = "/daily-report";
const dailyReportRoute = require('./dailyReport.routes');

const campaignRoutePrefix = "/campaign";
const campaignRoute = require('./campaign.routes');

const dialogRoutePrefix = "/dialog";
const dialogRoute = require('./dialog.routes');

const reportRoutesPrefix = "/report";
const reportRoutes = require('./report.routes');

const dealRoutePrefix = "/deal";
const dealRoute = require('./deal.routes');

const roleRoutePrefix = "/role";
const roleRoute = require('./role.routes');

const userRoleRoutePrefix = "/user-role";
const userRoleRoute = require('./userRole.routes');

const moduleRoutePrefix = "/module";
const moduleRoute = require('./module.routes');

const permissionRoutePrefix = "/permission";
const permissionRoute = require('./permission.routes');

const rolePermissionRoutePrefix = "/role-permission";
const rolePermissionRoute = require('./rolePermission.routes');

const influencerRoutePrefix = "/influencers";
const influencerRoute = require('./influencer.routes');

const userCreditsRoute = require("./userCredits.routes");
const userCreditsRoutePrefix = "/points"

const waysToEarnRoute = require("./waysToEarn.routes");
const waysToEarnRoutePrefix = "/ways-to-earn"

const feedRoute = require("./feed.routes");
const feedRoutePrefix = "/feeds"

const likeRoute = require("./like.routes");
const likeRoutePrefix = "/like"

const commentRoute = require("./comment.routes");
const commentRoutePrefix = "/comment"

function adminRoutes(server) {
    //locationsRoutes
    locationRoute.forEach((route) => {
        route.url = `${v1Prefix}${route.url}`;
        server.route(route);
    });
    //category routes
    categoryRoute.forEach((route) => {
        route.url = `${v1Prefix}${route.url}`;
        server.route(route);
    });
    //auth routes
    authRoute.forEach((route) => {
        route.url = `${v1Prefix}${route.url}`;
        server.route(route);
    });
    //merchant routes
    merchantRoute.forEach((route) => {
        route.url = `${v1Prefix}${merchantRoutePrefix}${route.url}`;
        server.route(route);
    });
    userRoute.forEach((route) => {
        route.url = `${v1Prefix}${userRoutePrefix}${route.url}`;
        server.route(route);
    });
    agentRoute.forEach((route) => {
        route.url = `${v1Prefix}${agentRoutePrefix}${route.url}`;
        server.route(route);
    });
    //media routes
    mediaRoute.forEach((route) => {
        route.url = `${v1Prefix}${mediaPrefix}${route.url}`;
        server.route(route);
    });

    //banner routes
    bannerRoute.forEach((route) => {
        route.url = `${v1Prefix}${bannerprefix}${route.url}`;
        server.route(route);
    });


    //reviews routes
    reviewsRoute.forEach((route) => {
        route.url = `${v1Prefix}${reviewsRoutePrefix}${route.url}`;
        server.route(route);
    });

    //reservation route
    reservationRoute.forEach((route) => {
        route.url = `${v1Prefix}${reservationRoutePrefix}${route.url}`;
        server.route(route);
    });

    //appconfig route
    appConfigRoute.forEach((route) => {
        route.url = `${v1Prefix}${appConfigRoutePrefix}${route.url}`;
        server.route(route);
    })

    //restaurant routes
    restaurantRoute.forEach((route) => {
        route.url = `${v1Prefix}${restaurantRoutePrefix}${route.url}`;
        server.route(route);
    })

    //notification routes
    notificationRoute.forEach((route) => {
        route.url = `${v1Prefix}${notificationRoutePrefix}${route.url}`;
        server.route(route);
    })

    //dinning routes
    dinningRoute.forEach((route) => {
        route.url = `${v1Prefix}${dinningRoutePrefix}${route.url}`;
        server.route(route);
    })

    //amenities routes
    amenitiesRoute.forEach((route) => {
        route.url = `${v1Prefix}${amenitiesRoutePrefix}${route.url}`;
        server.route(route);
    })

    //winner breakup routes
    winnerBreakupRoutes.forEach((route) => {
        route.url = `${v1Prefix}${winnerBreakupRoutePrefix}${route.url}`;
        server.route(route);
    })

    //tournament manifest  routes
    tournamentManifestRoutes.forEach((route) => {
        route.url = `${v1Prefix}${tournamentManifestPrefix}${route.url}`;
        server.route(route);
    })

    //tournaments routes
    tournamentsRoute.forEach((route) => {
        route.url = `${v1Prefix}${tournamentsRoutePrefix}${route.url}`;
        server.route(route);
    })

    //stories routes
    storiesRoute.forEach((route) => {
        route.url = `${v1Prefix}${storiesRoutePrefix}${route.url}`;
        server.route(route);
    })

    //tournament routes
    tournamentRuleRoute.forEach((route) => {
        route.url = `${v1Prefix}${tournamentRulePrefix}${route.url}`;
        server.route(route);
    })

    //appSettings routes
    appSettingsRoute.forEach((route) => {
        route.url = `${v1Prefix}${appSettingsRoutePrefix}${route.url}`;
        server.route(route);
    })

    //commissionPaymentHistory routes
    commissionPaymentHistoryRoute.forEach((route) => {
        route.url = `${v1Prefix}${commissionPaymentHistoryRoutePrefix}${route.url}`;
        server.route(route);
    })

    //deleted user routes
    deletedUserRoute.forEach((route) => {
        route.url = `${v1Prefix}${deletedUserRoutePrefix}${route.url}`;
        server.route(route);
    })

    //payment routes
    paymentRoute.forEach((route) => {
        route.url = `${v1Prefix}${paymentRoutePrefix}${route.url}`;
        server.route(route);
    })

    //coupon routes
    couponRoute.forEach((route) => {
        route.url = `${v1Prefix}${couponRoutePrefix}${route.url}`;
        server.route(route);
    })

    //coupon routes
    nukhbaStoreRoute.forEach((route) => {
        route.url = `${v1Prefix}${nukhbaStoreRoutePrefix}${route.url}`;
        server.route(route);
    })

    //organization routes 
    organizationRoute.forEach((route) => {
        route.url = `${v1Prefix}${organizationRoutePrefix}${route.url}`;
        server.route(route);
    })

    //notificationTeamplate routes 
    notificationTemplateRoute.forEach((route) => {
        route.url = `${v1Prefix}${notificationTemplatePrefix}${route.url}`;
        server.route(route);
    })

    //daily routes routes
    dailyReportRoute.forEach((route) => {
        route.url = `${v1Prefix}${dailyReportRoutePrefix}${route.url}`;
        server.route(route);
    })

    //campaign routes
    campaignRoute.forEach((route) => {
        route.url = `${v1Prefix}${campaignRoutePrefix}${route.url}`;
        server.route(route);
    })

    //dialogRoute routes
    dialogRoute.forEach((route) => {
        route.url = `${v1Prefix}${dialogRoutePrefix}${route.url}`;
        server.route(route);
    })
  
    //report routes
    reportRoutes.forEach((route) => {
        route.url = `${v1Prefix}${reportRoutesPrefix}${route.url}`;
        server.route(route);
    })
  
    //dealRoute routes
    dealRoute.forEach((route) => {
        route.url = `${v1Prefix}${dealRoutePrefix}${route.url}`;
        server.route(route);
    })

    //roleRoute routes
    roleRoute.forEach((route) => {
        route.url = `${v1Prefix}${roleRoutePrefix}${route.url}`;
        server.route(route);
    })

    //userRoleRoute routes
    userRoleRoute.forEach((route) => {
        route.url = `${v1Prefix}${userRoleRoutePrefix}${route.url}`;
        server.route(route);
    })

    //moduleRoute routes
    moduleRoute.forEach((route) => {
        route.url = `${v1Prefix}${moduleRoutePrefix}${route.url}`;
        server.route(route);
    })

    //permissionRoute routes
    permissionRoute.forEach((route) => {
        route.url = `${v1Prefix}${permissionRoutePrefix}${route.url}`;
        server.route(route);
    })

    //rolePermissionRoute routes
    rolePermissionRoute.forEach((route) => {
        route.url = `${v1Prefix}${rolePermissionRoutePrefix}${route.url}`;
        server.route(route);
    })

    //rolePermissionRoute routes
    influencerRoute.forEach((route) => {
        route.url = `${v1Prefix}${influencerRoutePrefix}${route.url}`;
        server.route(route);
    })
    
    //user credits routes
    userCreditsRoute.forEach((route) => {
        route.url = `${v1Prefix}${userCreditsRoutePrefix}${route.url}`;
        server.route(route);
    })

    //ways to earn routes
    waysToEarnRoute.forEach((route) => {
        route.url = `${v1Prefix}${waysToEarnRoutePrefix}${route.url}`;
        server.route(route);
    })

    //ways to earn routes
    feedRoute.forEach((route) => {
        route.url = `${v1Prefix}${feedRoutePrefix}${route.url}`;
        server.route(route);
    })

    likeRoute.forEach((route) => {
        route.url = `${v1Prefix}${likeRoutePrefix}${route.url}`;
        server.route(route);
    })

    commentRoute.forEach((route) => {
        route.url = `${v1Prefix}${commentRoutePrefix}${route.url}`;
        server.route(route);
    })

}

module.exports = {
    adminRoutes
}


var cron = require('node-cron');
const UserService = require("../services/users/user.service");
const TournamentManifestService = require("../services/admin/tournamentManifest.service");
const TournamentService = require("../services/admin/tournaments.service");
const DailyReportService = require('../services/admin/dailyReport.service');
const { Bit } = require('../constants/database');
const { greenConsoleText } = require('./common');
const UserEventService = require('../services/admin/userEvent.service');
const BannerService = require('../services/admin/banner.service');
const UserCreditsService = require('../services/admin/userCredits.service');

const { connection } = require("../dbConfig/dbConnect.js");

// Schedule a cron job to run every minute
cron.schedule('* * * * *', () => {
    console.log(greenConsoleText(' CRON: running a booking reminder task every minute  '));
    UserService.sendNotificationToUsersForBookingReminder();
});

// Schedule a cron job to run daily at 11:50 pm '55 23 * * *'
cron.schedule('55 23 * * *', async () => {
    console.log(greenConsoleText(' CRON: running to send daily active users to mysql at 11:55pm every night  '));
    await DailyReportService.dailyReport({ forceUpdate: true, is_nukhba_user: Bit.zero })
    await DailyReportService.dailyReport({ forceUpdate: true,is_nukhba_user: Bit.one })
});


// Schedule a cron job to run at every 30 seconds  */30 * * * * *
cron.schedule('*/10 * * * *', () => { //every 10 minute
    console.log(greenConsoleText(' CRON: Update tournament rank of users  '));
    TournamentManifestService.updateTournamentRank()
});


// Schedule a cron job to run every minute
cron.schedule('*/5 * * * *', () => {
    console.log(greenConsoleText(' CRON: cron to update tournament status from scheduled to live and also from live to completed  '));
    TournamentService.updateTournamentStatus()
});

// Schedule a cron job to run every minute
cron.schedule('*/6 * * * *', () => {
    console.log(greenConsoleText(' CRON: cron to update user points  '));
    UserEventService.initiateCoinProcessing();
});
              
// Schedule a cron job to run daily at 01:00 am '00 01 * * *'
cron.schedule('00 01 * * *', async () => {
    console.log(greenConsoleText(' CRON: cron to update status of banner who expired'));
    BannerService.updateStatus()
});

// Schedule a cron job to run daily at 01:00 am '00 01 * * *'
cron.schedule('*/6 * * * *', async () => {
    try {
        console.log(greenConsoleText(' CRON: cron to update status of influencer commission'));
        //fetchinng transaction connection
        transaction = await connection().getConnection();
        //beiginning transaction
        await transaction.beginTransaction();
        await UserCreditsService.updateInfluencerCommissionCreditStatus({dbTransaction: transaction})
        if (transaction) {
            await transaction.commit();
            console.log("TRANSACTION COMMIT");
        }
    }  catch (error) {
        console.error(error);
        if (transaction) {
            await transaction.rollback();
            console.log("TRANSACTION ROLLBACK");
        }
        return 0;
    } finally {
        if (transaction) {
            transaction.release();
            console.log("TRANSACTION RELEASE");
        }
        return 1;
    }
    
});


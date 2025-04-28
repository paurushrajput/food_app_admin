const ClientError = require("../../error/clientError");
const TournamentModel = require("../../models/mysql/tournament.model");
const TournamentManifestModel = require("../../models/mysql/tournamentManifest.model");
const { TournamentStatus } = require("../../constants/tournaments");
const { getKeyByValue } = require("../../utils/common");
const { getUrlFromBucket } = require("../../utils/s3");
const AppConfigModel = require("../../models/mysql/appconfig.model");
const UsersModel = require("../../models/mysql/users.model");
const { SYSTEM_USERS } = require("../../constants/variables");

class TournamentManifestService {

    static async getAndFilterTournamentManifestList(data) {
        let {
            page = 1,
            page_size = 10,
            is_paginated = true,
            sort_by = 'tm.created_at',
            order = 'desc',
            tournament,
            user_data,
            user
        } = data;

        if (order.toLowerCase().trim().includes("asc") == "asc") {
            order = 'asc'
        }

        if (sort_by != 'tm.created_at') {
            sort_by = `tm.${sort_by}`
        }

        const sort = `${sort_by} ${order}`;
        const limit = Number(page_size);
        const offset = (Number(page) - 1) * Number(page_size);

        const response = await TournamentManifestModel.listTournamentManifestList({ sort, offset, limit, is_paginated, tournament, user_data });

        return {
            count: response.count,
            rows: response.rows,
        };
    }

    static async updateTournamentRank(data = {}) {
        const { tournament_id } = data;
        let tournaments = [];
        if (tournament_id) {
            //finding tournaments by id
            tournaments = await TournamentModel.findCurrentlyLiveTournamentById(tournament_id) || [];
            if (tournaments.length > 0) {
                const tournament = tournaments[0];
                if (tournament.status != TournamentStatus.live) {
                    throw new ClientError(`The tournament is in ${getKeyByValue(TournamentStatus, tournament.status)} state not live.`);
                }
            } else {
                throw new ClientError("Invalid tournament Id")
            }
        } else {
            //finding all currently ongoing live tournaments
            tournaments = await TournamentModel.findCurrentlyLiveTournaments() || [];
        }


        //finding system users
        const [systemUsers] = await AppConfigModel.getAppConfigByTitle(SYSTEM_USERS);
        let systemUserIds = [];
        if (systemUsers?.value?.length > 0) {
            const users = await UsersModel.findIdWithEmailMultiple(systemUsers.value) || [];
            systemUserIds = users?.map(user => user.id)
        }

        for (let tournament of tournaments) {
            //finding tournament manifest details of this tournament
            const userScores = [];
            const tournamentManifests = await TournamentManifestModel.findByTournamentId(tournament.id, systemUserIds);

            for (let tournamentManifest of tournamentManifests) {
                //accumualting user data and score
                userScores.push({
                    id: tournamentManifest.id,
                    score: tournamentManifest.total_score,
                })
            }

            if (userScores.length > 0) {
                //sorting the user based on rank
                const userScoreWithRank = TournamentManifestService.getUserRankings(userScores);
                for (let user of userScoreWithRank) {
                    await TournamentManifestModel.updateOneById({
                        user_rank: user.rank,
                    }, user.id);
                }
            }

        }
        return {
            msg: 'Rank updated successfully'
        }
    }

    static getUserRankings(userScores) {
        // Sort the array based on scores (higher scores come first)
        userScores.sort((a, b) => b.score - a.score);

        // Assign ranks to each user
        let currentRank = 1;
        let currentScore = userScores[0].score;

        for (let i = 0; i < userScores.length; i++) {
            if (userScores[i].score < currentScore) {
                currentRank = i + 1;
                currentScore = userScores[i].score;
            }
            userScores[i].rank = currentRank;
        }

        return userScores;
    }

    static async getTournamentLeaderBoard(data) {
        const {
            page = 1,
            page_size = 10,
            is_paginated = true,
            sort_by = 'tm.user_rank',
            order = 'asc',
            tournament_id,
            user,
            keyword, rank_from, rank_to
        } = data;

        const [tournament] = await TournamentModel.getOneByColumn({ column: "uid", value: tournament_id });
        if (!tournament) {
            throw new ClientError("Invalid tournament_id provided");
        }

        const userReferralPoints = Number(tournament.user_referral_points);

        const sort = `${sort_by} ${order}`;
        const limit = Number(page_size);
        const offset = (Number(page) - 1) * Number(page_size);
        const [systemUsers] = await AppConfigModel.getAppConfigByTitle(SYSTEM_USERS);
        let systemUserIds = [];
        if (systemUsers?.value?.length > 0) {
            const users = await UsersModel.findIdWithEmailMultiple(systemUsers.value) || [];
            systemUserIds = users?.map(user => user.id)
        }

        const response = await TournamentManifestModel.getTournamentManifestByTournamentId({ sort, offset, limit, is_paginated, tournament_id: tournament.id, systemUserIds, keyword, rank_from, rank_to });

        return {
            count: response.count,
            rows: response.rows?.map(elem => {
                const referralUserDetails = elem.referral_user_details || [];
                const numOfReferralUsers = referralUserDetails.length || 0;
                const referralPoints = numOfReferralUsers * userReferralPoints;
                delete elem.referral_user_details;
                return {
                    ...elem,
                    num_of_referral_users: numOfReferralUsers,
                    referral_points: referralPoints,
                    profile_pic: getUrlFromBucket(elem.profile_pic),
                }
            }),
        };
    }

    static async findOneByTitle(title) {
        const statement = {
            text: `SELECT title, value FROM ${Tables.APPCONFIG} where title = ? ;`,
            values: [title],
        }
        const result = await db.query(statement);
        return result.rows;
    }
}

module.exports = TournamentManifestService;
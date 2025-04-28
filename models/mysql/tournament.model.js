const { db, inMapper, insertData, updateSingle } = require("../../dbConfig/dbConnect");
const { Tables, Operations, UnknownUser, Status } = require("../../constants/database");
const { TournamentStatus } = require("../../constants/tournaments");

class TournamentsModel {

    static async findCurrentlyLiveTournaments() {
        const statement = {
            text: `SELECT id, title, date_start, date_end FROM ${Tables.TOURNAMENTS} WHERE NOW() BETWEEN FROM_UNIXTIME(date_start) AND FROM_UNIXTIME(date_end) AND status = ${TournamentStatus.live} AND deleted_at IS NULL;`,
            values: [],
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async findCurrentlyLiveTournamentById(tournament_id) {
        const statement = {
            text: `SELECT id, title, date_start, date_end, status FROM ${Tables.TOURNAMENTS} WHERE uid = ? AND deleted_at IS NULL;`,
            values: [tournament_id],
        }
        const result = await db.query(statement);
        return result.rows;
    }

    static async getOneByColumn(body) {
        const { column = 'id', value = "" } = body;

        let text = `SELECT t.id, t.uid, t.title, t.max_user, t.user_referral_points, (select count(id) from ${Tables.TOURNAMENT_MANIFEST} where deleted_at is null and tournament_id = t.id) as joined_user_count from ${Tables.TOURNAMENTS} t WHERE ${column} = ? AND t.deleted_at IS NULL;`

        const statement = {
            text,
            values: [value],
            rowsOnly: true,
        }

        const result = await db.query(statement);

        return result.rows;
    };
}

module.exports = TournamentsModel;
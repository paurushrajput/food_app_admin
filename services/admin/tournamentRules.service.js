const ClientError = require("../../error/clientError");
const TournamentRulesModel = require("../../models/mysql/tournamentRules.model");
const ServerError = require("../../error/serverError");
const { Pagination } = require("../../constants/database");
const {checkMandatoryFields, isEmptyField, getTrimmedValue} = require("../../utils/common.js");

class TournamentRulesService {

    static async addTournamentRule(data) {
        let { name = null, rule = null, user } = data;

        if (name == null && rule == null) {
            throw new ClientError("name or rule or both are required");
        }

        name = getTrimmedValue(name);
        const tournamentRuleObj = {
            name: name,
            rule,
            created_by: user,
        }

        const [existTourRule] = await TournamentRulesModel.findOneByName(name);
        if(existTourRule)
            throw new ClientError("Tournament rule already exist with same name")

        const { rows } = await TournamentRulesModel.insert(tournamentRuleObj);
        if (rows != 1) {
            throw new ServerError("Unable to add tournament rule")
        }

        return {
            msg: 'Tournament rules added successfully'
        }
    }

    static async getAndFilterTournamentRulesList(data) {
        let {
            page = 1,
            page_size = 10,
            is_paginated = true,
            sort_by = 'created_at',
            order = 'desc',
            name,
            user
        } = data;

        if(isEmptyField(sort_by)) sort_by = Pagination.defaultSortColumn;
        if(isEmptyField(order)) order = Pagination.defaultOrder;
        if(isEmptyField(page)) page = Pagination.defaultPage;
        if(isEmptyField(page_size)) page_size = Pagination.pageSize;
        if(getTrimmedValue(is_paginated) === "false") is_paginated = false;
        else is_paginated = true;

        const sort = `${sort_by} ${order}`;
        const limit = Number(page_size);
        const offset = (Number(page) - 1) * Number(page_size);
        const response = await TournamentRulesModel.listTournamentRuleList({ sort, offset, limit, is_paginated, name });

        return {
            count: response.count,
            rows: response.rows,
        };
    }

    static async updateTournamentRule(data) {
        let { rule_id, name = null, rule = null, user } = data;
        const [tournamentRule] = await TournamentRulesModel.findOneByuId(rule_id);
        if (!tournamentRule) {
            throw new ClientError("Invalid rule id")
        }

        if (name == null && rule == null) {
            throw new ClientError("name or rule or both are required");
        }

        if(!isEmptyField(name)){
            name = getTrimmedValue(name);
            const [existTourRule] = await TournamentRulesModel.findOneByName(name);
            if(existTourRule && existTourRule.id != tournamentRule.id)
                throw new ClientError("Tournament rule already exist with same name")
        }

        const tournamentRuleObj = {
            name: name || tournamentRule.name,
            rule: rule || tournamentRule.rule,
        }

        const { rows } = await TournamentRulesModel.updateOneById(tournamentRuleObj, tournamentRule.id);
        if (rows != 1) {
            throw new ServerError("Unable to updated tournament rule")
        }

        return {
            msg: 'Tournament rules updated successfully'
        }
    }

    static async deleteTournamentRule(data) {
        const { rule_id, user } = data;
        const [tournamentRule] = await TournamentRulesModel.findOneByuId(rule_id);
        if (!tournamentRule) {
            throw new ClientError("Invalid rule id")
        }

        const { rows } = await TournamentRulesModel.updateOneById({ deleted_at: "CURRENT_TIMESTAMP" }, tournamentRule.id);
        if (rows != 1) {
            throw new ServerError("Unable to delete tournament rule")
        }

        return {
            msg: 'Tournament rules deleted successfully'
        }
    }
}

module.exports = TournamentRulesService;
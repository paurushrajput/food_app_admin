const OrganizationModel = require("../../models/mysql/organization.model.js");
const { OrganizationStatus } = require("../../constants/database.js");
const { getKeyByValue } = require("../../utils/common.js");

class OrganizationService {

    static async getList(data) {
        const { user } = data;
        const organizations = await OrganizationModel.getOrganizationList();
        return {
            rows: organizations?.map(elem => ({
                ...elem,
                status: getKeyByValue(OrganizationStatus, elem.status)
            }))
        };
    }
}


module.exports = OrganizationService;
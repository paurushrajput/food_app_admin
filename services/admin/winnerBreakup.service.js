const ClientError = require("../../error/clientError");
const WinnerBreakupModel = require("../../models/mysql/winnerBreakup.model");
const MediaModel = require("../../models/mysql/media.model");
const { getUrlFromBucket } = require("../../utils/s3");
const { WinnerBreakupType } = require("../../constants/variables");
const { Pagination } = require("../../constants/database");
const {checkMandatoryFields, isEmptyField, getTrimmedValue} = require("../../utils/common.js");

class WinnerBreakupService {

    static async addWinnerBreakup(data) {
        let { name, break_up, user } = data;

        name = getTrimmedValue(name);
        const winnerBreakUp = {
            name,
            break_up,
            created_by: user,
        };

        const [existBreakup] = await WinnerBreakupModel.findOneByName(name);
        if(existBreakup)
            throw new ClientError("Winner breakup already exist with same name")

        const breakUp = await WinnerBreakupService.breakUpValidationAndEnhancement(break_up);

        const { rows } = await WinnerBreakupModel.insert({ ...winnerBreakUp, break_up: breakUp });
        if (rows != 1) {
            throw new GeneralError('Unable to add winner break_up');
        }
        return {
            msg: "Winner break_up added successfully"
        };
    }

    static async updateWinnerBreakup(data) {
        let { name = null, break_up = null, breakup_id, user } = data;
        if (name == null && (break_up == null || break_up?.length < 1)) {
            throw new ClientError("Please provide name or break_up or both in order to update break_up")
        }

        let breakUp = await WinnerBreakupService.breakUpValidationAndEnhancement(break_up);

        if (breakUp?.length < 1) {
            breakUp = undefined;
        }
        const [existingWinnerBreakUp] = await WinnerBreakupModel.findOneByuId(breakup_id);

        if (!existingWinnerBreakUp) {
            throw new ClientError("Invalid break_up id")
        }

        if(!isEmptyField(name)){
            name = getTrimmedValue(name);
            const [existBreakup] = await WinnerBreakupModel.findOneByName(name);
            if(existBreakup && existBreakup.id != existingWinnerBreakUp.id)
                throw new ClientError("Winner breakup already exist with same name")
        }

        const winnerBreakUp = {
            name: name || existingWinnerBreakUp.name,
            break_up: breakUp || existingWinnerBreakUp.break_up,
        };

        const { rows } = await WinnerBreakupModel.updateOneById(winnerBreakUp, existingWinnerBreakUp.id);
        if (rows != 1) {
            throw new GeneralError('Unable to update winner break_up');
        }
        return {
            msg: "Winner break_up updated successfully"
        };
    }

    static async getAndFilterWinnerBreakupList(data) {
        let {
            page = 1,
            page_size = 10,
            is_paginated = true,
            sort_by = 'created_at',
            order = 'desc',
            name,
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
        const response = await WinnerBreakupModel.listWinnerBreakup({ sort, offset, limit, is_paginated, name });

        return {
            count: response.count,
            rows: await Promise.all(response.rows?.map(async elem => {
                for (let b = 0; b < elem?.break_up?.length; b++) {
                    const [media] = await MediaModel.getOneById(elem.break_up[b].image);
                    if (media) {
                        const filepath = `${media.basePath}/${media.filename}`;
                        if (filepath) {
                            elem.break_up[b].image = getUrlFromBucket(filepath);
                        } else {
                            elem.break_up[b].image = '';
                        }
                    } else {
                        elem.break_up[b].image = '';
                    }

                    if(elem.break_up[b].rank_from == elem.break_up[b].rank_to){
                        elem.break_up[b].rank = elem.break_up[b].rank_from;
                        delete elem.break_up[b].rank_from;
                        delete elem.break_up[b].rank_to;
                        delete elem.break_up[b]?.price_amount;
                    }

                    delete elem.break_up[b].type;
                }
                return {
                    ...elem
                }
            })),
        };
    }

    static async deleteWinnerBreakup(data) {
        const { breakup_id, user } = data;
        const [existingWinnerBreakUp] = await WinnerBreakupModel.findOneByuId(breakup_id);

        if (!existingWinnerBreakUp) {
            throw new ClientError("Invalid break_up id")
        }

        const { rows } = await WinnerBreakupModel.updateOneById({ deleted_at: "CURRENT_TIMESTAMP" }, existingWinnerBreakUp.id);
        if (rows != 1) {
            throw new GeneralError('Unable to delete winner break_up');
        }
        return {
            msg: "Winner break_up deleted successfully"
        };
    }

    static hasSameRank(array) {
        const rankSet = new Set();

        for (const item of array) {
            if (rankSet.has(item.rank)) {
                return true; // Found an element with the same rank
            } else {
                rankSet.add(item.rank);
            }
        }

        return false; // No elements with the same rank
    }

    static async breakUpValidationAndEnhancement(break_up = []) {

        if (break_up.length < 1) {
            return break_up;
        }

        //checking if the breakup has same rank of not
        if (WinnerBreakupService.hasSameRank(break_up)) {
            throw new ClientError("Duplicate rank found inside breakup")
        }

        //accumulating all the image ids received in breakup
        const imageArr = break_up.map(elem => elem.image);
        const imageUniqueArr = [...new Set(imageArr)];

        //checking if any element of breakup consists of duplicate image
        if (imageArr.length != imageUniqueArr.length) {
            throw new ClientError("Images inside breakup consists of duplicate image")
        }

        //checking if each item of breakup has image field or not
        if (imageArr.length != break_up.length) {
            throw new ClientError("Each element of breakup should have image")
        }

        //finding those image ids in our database
        const imageMedia = await MediaModel.checkIfIdsExist(imageArr) || []

        //checking if all the received image ids exists in our database or not
        if (imageMedia.length != imageArr.length) {
            const invalidImageIds = [];

            //finding all the non-existing image ids
            for (let img of imageArr) {
                const imageExist = imageMedia.find(elem => elem.uid == img)
                if (!imageExist) {
                    invalidImageIds.push(img);
                }
            }
            throw new ClientError(`These images ${invalidImageIds.toString()} are not found in our database`);
        }

        //all good, manipulating breakup
        for (let b = 0; b < break_up.length; b++) {
            break_up[b].rank_from = break_up[b].rank;
            break_up[b].rank_to = break_up[b].rank;
            break_up[b].type = WinnerBreakupType.ASSETS;
            delete break_up[b].rank;
            const imageInDb = imageMedia.find(elem => elem.uid == break_up[b].image);
            break_up[b].image = imageInDb.id;
        }

        return break_up;
    }
}

module.exports = WinnerBreakupService;
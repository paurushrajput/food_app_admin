const ClientError = require("../../error/clientError");
const {
    isEmptyField,
    getTrimmedValue,
    isEmpty,
    getKeyByValue,
} = require("../../utils/common.js");

const CommentModel = require("../../models/mysql/comment.model.js");
const { Pagination, FEED_TYPE, Bit } = require("../../constants/database.js");
const { getUrlFromBucket } = require("../../utils/s3.js");

class CommentService {
    static async Commentlist(body) {
        let {
            feed_id,
            post_type,
            page = 1,
            page_size = 10,
            is_paginated = true,
            sort_by = "",
            order = "",
        } = body;
        if (isEmptyField(sort_by)) sort_by = Pagination.defaultSortColumn;
        if (isEmptyField(order)) order = Pagination.defaultOrder;
        if (isEmptyField(page)) page = Pagination.defaultPage;
        if (isEmptyField(page_size)) page_size = Pagination.pageSize;
        if (getTrimmedValue(is_paginated) === "false") is_paginated = false;
        else is_paginated = true;

        const sort = `${sort_by} ${order}`;
        const limit = Number(page_size);
        const offset = (Number(page) - 1) * Number(page_size);
        // check if like exist
        const commentResult = await CommentModel.getComment({
            feed_id,
            post_type,
            sort,
            limit,
            offset,
            is_paginated,
        })
        const likes = commentResult?.rows[0]
        if (isEmpty(likes)) {
            return {
                count: Number(commentResult?.count ?? 0),
                rows: [],
            };
        }
        return {
            count: Number(commentResult?.count ?? 0),
            rows: likes
        };
    }

}
module.exports = CommentService;

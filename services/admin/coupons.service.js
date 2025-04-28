const ClientError = require("../../error/clientError");
const ServerError = require("../../error/serverError.js");
const CouponsModel = require("../../models/mysql/coupons.model.js");
const UsersModel = require("../../models/mysql/users.model.js");
const OrganizationModel = require("../../models/mysql/organization.model.js");
const { Pagination, CouponDiscountType, CouponType, CouponStatus, Bit } = require("../../constants/database");
const { getKeyByValue, isEmptyField, getTrimmedValue } = require("../../utils/common.js");
const { generateCouponCode } = require("../../utils/couponCode.js");
const CouponRedeemModel = require("../../models/mysql/couponRedeem.model.js");
const UserCouponModel = require("../../models/mysql/userCoupons.model.js");

class CouponService {

    static async addCoupon(data) {
        const {
            uses_per_user,
            user_id = null,
            organization_id,
            coupon_code,
            discount,
            discount_type = CouponDiscountType.FLAT,
            max_discount,
            min_use,
            max_use,
            description,
            expiration_at,
            type,
            user,
            override_coupon_code = false,
            rules = []
        } = data;

        let userId;
        //checking if user_id is valid
        if (type == CouponType.user) {
            if (user_id == null) {
                throw new ClientError(`user_id is required when type is ${CouponType.user}`)
            }
            const [existingUser] = await UsersModel.findUserWithUid(user_id);
            if (!existingUser) {
                throw new ClientError("Invalid user_id")
            }
            userId = existingUser.id;
        }

        //checking if expiration time is valid
        if (expiration_at <= Math.floor(Date.now() / 1000)) {
            throw new ClientError("Expiration time must be greater than current datetime");
        }

        let organizationId;

        if (organization_id) {
            const [existingOrganization] = await OrganizationModel.findOneByuId(organization_id);
            if (!existingOrganization) {
                throw new ClientError("Invalid organization Id");
            }
            organizationId = existingOrganization.id;
        }

        let msg = 'Coupon code added successfully';

        let couponCode = coupon_code;
        if (!couponCode) {
            couponCode = await getCouponCode();
        } else {
            const [couponExists] = await CouponsModel.couponCodeExists(couponCode);
            if (Number(couponExists.count > 0)) {
                if (override_coupon_code) {
                    couponCode = await getCouponCode();
                    msg = 'Coupon code added successfully by overriding';
                } else {
                    throw new ClientError('Duplicate coupon code')
                }
            }
        }

        //creating coupon object
        const coupon = {
            uses_per_user,
            organization_id: organizationId,
            coupon_code: couponCode,
            discount,
            discount_type,
            max_discount,
            min_use,
            max_use,
            description,
            expiration_at,
            type,
            rules
        };

        //validating organizationId
        if (organizationId) {
            if (type != CouponType.organization) {
                throw new ClientError(`Organization Id should not be passed if type is equal to ${CouponType.global} or ${CouponType.user} `)
            }
            coupon['organization_id'] = organizationId;
        }

        const { rows } = await CouponsModel.insert(coupon);
        if (rows != 1) {
            throw new GeneralError('Unable to add coupon');
        }

        //inserting user specific coupon
        if (type == CouponType.user) {

            if (typeof userId == 'undefined') {
                throw new ClientError("Invalid user")
            }

            //fetching last inserted couponId
            const [newCoupon] = await CouponsModel.findIdByCouponCode(couponCode);
            if (!newCoupon) {
                throw new ServerError("Unable to add coupons")
            }

            const coupon_id = newCoupon.id;

            // const couponRedeem = [];
            //creating coupon redeem array
            // for (let i = 0; i < uses_per_user; i++) {
            //     couponRedeem.push({
            //         coupon_id: coupon_id,
            //         user_id: userId,
            //     })
            // }
            // await CouponRedeemModel.insert(couponRedeem)
            await UserCouponModel.allocateCouponsToUser({ user_id: userId, coupon_id, count: uses_per_user })
        }

        return {
            msg
        };
    }

    static async updateCoupon(data) {
        const {
            coupon_id,
            uses_per_user,
            discount,
            discount_type,
            max_discount,
            min_use,
            max_use,
            description,
            expiration_at,
            rules = [],
            user
        } = data;

        if (expiration_at <= Math.floor(Date.now() / 1000)) {
            throw new ClientError("Expiration time must be greater than current datetime");
        }

        const [existingCoupon] = await CouponsModel.findOneByuId(coupon_id);
        if (!existingCoupon) {
            throw new ClientError("Invalid coupon_id")
        }

        const isCouponAssigned = await CouponsModel.checkIfCouponAssigned(coupon_id)
        if (
            isCouponAssigned &&
            (!isEmptyField(uses_per_user) ||
                !isEmptyField(discount) ||
                !isEmptyField(discount_type) ||
                !isEmptyField(max_discount) ||
                !isEmptyField(min_use) ||
                !isEmptyField(max_use) ||
                !isEmptyField(expiration_at)
            )) {
            throw new ClientError("Cannot update as coupon already assigned to users");
        }

        const coupon = {
            uses_per_user: uses_per_user || existingCoupon?.uses_per_user,
            discount: discount || existingCoupon?.discount,
            discount_type: discount_type || existingCoupon?.discount_type,
            max_discount: max_discount || existingCoupon?.max_discount,
            min_use: min_use || existingCoupon?.min_use,
            max_use: max_use || existingCoupon?.max_use,
            description: description || existingCoupon?.description,
            expiration_at: expiration_at || existingCoupon?.expiration_at,
            rules: rules.length ? rules : existingCoupon?.rules,
        };

        const { rows } = await CouponsModel.updateOneById(coupon, existingCoupon.id);
        if (rows != 1) {
            throw new GeneralError('Unable to updated coupon');
        }
        return {
            msg: 'Coupon updated successfully'
        };
    }

    static async getAndFilterCouponList(data) {
        let {
            page = 1,
            page_size = 10,
            is_paginated = true,
            sort_by = 'c.created_at',
            order = 'desc',
            organization_id,
            uses_per_user,
            discount,
            discount_type,
            type,
            status,
            campaign_title,
            is_expired,
            is_deleted
        } = data;

        let organizationId = "";
        if (organization_id) {
            const [existingOrganization] = await OrganizationModel.findOneByuId(organization_id);
            if (!existingOrganization) {
                throw new ClientError("Invalid organization_id");
            }
            organizationId = existingOrganization.id;
        }

        if (isEmptyField(sort_by)) sort_by = `c.${Pagination.defaultSortColumn}`;
        if (isEmptyField(order)) order = Pagination.defaultOrder;
        if (isEmptyField(page)) page = Pagination.defaultPage;
        if (isEmptyField(page_size)) page_size = Pagination.pageSize;
        if (getTrimmedValue(is_paginated) === "false") is_paginated = false;
        else is_paginated = true;

        const sort = `${sort_by} ${order}`;
        const limit = Number(page_size);
        const offset = (Number(page) - 1) * Number(page_size);

        const response = await CouponsModel.listAndFilterCoupons({ sort, offset, limit, is_paginated, organization_id: organizationId, uses_per_user, discount, discount_type, type, status, is_deleted, is_expired, campaign_title });

        return {
            count: response.count,
            rows: response.rows?.map(coupon => ({
                ...coupon,
                discount_type: getKeyByValue(CouponDiscountType, coupon.discount_type),
                type: getKeyByValue(CouponType, coupon.type),
                status: getKeyByValue(CouponStatus, coupon.status),
                assigned_cpn_count: Number(coupon?.assigned_cpn_count),
                unused_cpn_count: Number(coupon?.unused_cpn_count),
                used_cpn_count: Number(coupon?.assigned_cpn_count) - Number(coupon?.unused_cpn_count),
                is_deleted: Boolean(coupon.deleted_at)
            })),
        };
    }

    static async deleteCoupon(data) {
        const { coupon_id, user } = data;
        const [coupon] = await CouponsModel.findOneByuId(coupon_id);

        //checking if coupons exists
        if (!coupon) {
            throw new ClientError("Invalid coupon id")
        }

        //checking if couponse is being used
        // const [couponRedeem] = await CouponsModel.findTotalUseByCouponId(coupon.id);
        // if (Number(couponRedeem.count) > 0) {
        //     throw new ClientError(`Cannot be deleted as this coupon is already used by ${couponRedeem.count} users`)
        // }

        //soft deleting coupon
        const { rows } = await CouponsModel.updateOneById({ deleted_at: "CURRENT_TIMESTAMP" }, coupon.id);
        if (rows != 1) {
            throw new GeneralError('Unable to delete coupon');
        }
        return {
            msg: "Coupon deleted successfully"
        };
    }
}

async function getCouponCode() {
    let couponCode;
    let couponExists;
    do {
        couponCode = generateCouponCode();
        couponExists = await CouponsModel.couponCodeExists(couponCode)
    } while (couponExists[0].count > 0)

    return couponCode;
}

module.exports = CouponService;
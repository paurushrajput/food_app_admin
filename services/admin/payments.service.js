const PaymentsModel = require("../../models/mysql/payments.model");
const { PaymentModes, PaymentStatus, AuthKey, StoreId, GatewayInitiatePaymentUrl } = require("../../constants/payments");
const { getKeyByValue } = require("../../utils/common");
const { dateTimeToDateOnly, formatTime } = require("../../utils/date");
const { UnknownUser, Pagination, PAYMENT_TYPE } = require("../../constants/database");
const { formatDate } = require("../../utils/moment.js");
const { isEmptyField, getTrimmedValue } = require("../../utils/common.js");
const { post } = require("../../utils/fetch");

class PaymentService {

    static async listPayments(data) {
        let {
            page = 1,
            page_size = 10,
            is_paginated = true,
            sort_by = 'id',
            order = 'desc',
            keyword,
            restaurant_name,
            user_email,
            reservation_id,
            from_date, 
            to_date, 
            slot_time, 
            amount, 
            payment_date_start, 
            payment_date_end, 
            payment_status, 
            payment_mode,
            is_nukhba_user = undefined,
            is_pilot = undefined,
            payment_type,
            order_status_code
        } = data;

        if (isEmptyField(sort_by)) sort_by = Pagination.defaultSortColumn;
        if (isEmptyField(order)) order = Pagination.defaultOrder;
        if (isEmptyField(page)) page = Pagination.defaultPage;
        if (isEmptyField(page_size)) page_size = Pagination.pageSize;
        if (getTrimmedValue(is_paginated) === "false") is_paginated = false;
        else is_paginated = true;

        // if (sort_by != 'p.id') {
        //     sort_by = `p.${sort_by}`
        // }

        const sort = `${sort_by} ${order}`;
        const limit = Number(page_size);
        const offset = (Number(page) - 1) * Number(page_size);

        const response = await PaymentsModel.getPaymentList({
            sort,
            offset,
            limit,
            is_paginated,
            keyword,
            restaurant_name,
            user_email,
            reservation_id,
            from_date, 
            to_date, 
            slot_time, amount, 
            payment_date_start, 
            payment_date_end, 
            payment_status, 
            payment_mode,
            is_nukhba_user,
            is_pilot,
            payment_type,
            order_status_code
        });

        return {
            count: response.count,
            rows: response.rows?.map(each => {
                const formattedEntry = {
                  ...each,
                  booking_date: formatDate(each?.booking_date, 'DD-MMM-YY'),
                  booking_created_date: formatDate(each?.booking_created_date, 'DD-MMM-YY'),
                  payment_date: formatDate(each?.payment_date, 'DD-MMM-YY'),
                  slot_time: formatTime(each?.slot_time),
                  username: each?.username?.trim().length > 0 ? each?.username?.trim() : UnknownUser,
                  payment_status: getKeyByValue(PaymentStatus, each.payment_status),
                  payment_mode: getKeyByValue(PaymentModes, each.payment_mode),
                  payment_details: each?.other_details?.payment_info?.order?.status || {"code": 1, "text": "Pending"},
                  txn_details: each?.other_details?.payment_info?.order?.transaction || {},
                  payment_type: {
                    key: getKeyByValue(PAYMENT_TYPE, each.payment_type),
                    value: each.payment_type,
                  },
                };

                // Delete the other_details property
                delete formattedEntry.other_details;
              
                return formattedEntry;
              })
        }
    }

  static async updatePaymentTxnCode() {
    const payments = await PaymentsModel.getAllPayments();

    for(let payment of payments){
      await PaymentsModel.updateOneById({
        order_status_code: payment?.other_details?.payment_info?.order?.status?.code || "null",
        txn_status_code: payment?.other_details?.payment_info?.order?.transaction?.code || "null"
      }, payment.id);
    }
    return { msg: 'Payment Updated' };
  }

  static async getPaymentInfoByRefTxnId() {
    const payments = await PaymentsModel.getAllPendingStatusCodePayments();

    for(let payment of payments){
      const payload = {
        "method": "check",
        "store": StoreId,
        "authkey": AuthKey,
        "order": {
          "ref": payment?.ref_txn_id
        }
      };
  
      const paymentStatusResult = await post({ url: GatewayInitiatePaymentUrl, body: payload, headers: {} });
      const updateObj = {};
  
      if(paymentStatusResult){
        updateObj.order_status_code = paymentStatusResult?.data?.order?.status?.code || "null",
        updateObj.txn_status_code = paymentStatusResult?.data?.order?.transaction?.code || "null"
        updateObj.other_details = { ...payment.other_details, payment_info: paymentStatusResult?.data };
        await PaymentsModel.updateOneById(updateObj, payment.id);
      }
    }
  }
}

module.exports = PaymentService;
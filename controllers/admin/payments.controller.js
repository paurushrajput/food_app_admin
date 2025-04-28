const PaymentService = require("../../services/admin/payments.service");
const RequestHandler = require("../../utils/requestHandler");

class PaymentsController {
    static async listPaymentsHandler(request, reply) {
        const validData = request.userInput;
        const data = await PaymentService.listPayments(validData);
        return RequestHandler.successHandler(request, reply, data);
    }
    static async updatePaymentTxnCodeHandler(request, reply) {
        const validData = request.userInput;
        const data = await PaymentService.updatePaymentTxnCode(validData);
        return RequestHandler.successHandler(request, reply, data);
    }
    static async getPaymentInfoByRefTxnIdHandler(request, reply) {
        const validData = request.userInput;
        const data = await PaymentService.getPaymentInfoByRefTxnId(validData);
        return RequestHandler.successHandler(request, reply, data);
    }
}

module.exports = PaymentsController;
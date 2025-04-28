const TelrGatewayRefundUrl = "https://secure.telr.com/gateway/remote.xml";
const GatewayInitiatePaymentUrl = "https://secure.telr.com/gateway/order.json";

const RefundAuthKey = process.env.TELR_REFUND_AUTH_KEY;
const StoreId = process.env.TELR_STORE_ID;
const AuthKey = process.env.PAYMENT_AUTH;

const PaymentModes = {
  online: 1,
  cheque: 2,
  autodebit: 3,
  cash: 4
}

const PaymentStatus = {
  active: { key : 'active', value: 0 },
  completed: { key : 'completed', value: 1 },
  refunded: { key : 'refunded', value: 3, text: 'Refund Initiated' },
  failed: { key : 'failed', value: 4 },
  clickedBack : { key : 'clickedBack', value: 5, text: "Clicked Back" }
}

const Currency = {
  AED: 'AED',
}

const CurrencyType = {
  FLAT: "flat",
  PERCENT: "percent"
}

const CommissionBasePrice = 10;
const CommissionAdvance = 5;

const OrderStatusCode = {
  pending: 1,
  authorized: 2,
  paid: 3,
  redeemed:4,
  expired: -1,
  cancelled: -2,
  declined: -3,
}

module.exports = {
  PaymentModes,
  PaymentStatus,
  TelrGatewayRefundUrl,
  GatewayInitiatePaymentUrl,
  RefundAuthKey,
  AuthKey,
  StoreId,
  CommissionBasePrice,
  CommissionAdvance,
  OrderStatusCode
}

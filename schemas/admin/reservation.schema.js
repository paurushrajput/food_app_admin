const { BookingType, BookingCancelType, ReservationTrackStatus, IS_NUKHBA_USER, Bit } = require("../../constants/database");
const { OrderStatusCode, PaymentStatus } = require("../../constants/payments");
const getReservationList = {
    query: {
      type: 'object',
      properties: {
        page: { type: 'string' },
        page_size: { type: 'string' },
        booking_type: { type: 'string', enum: [...Object.values(BookingType) , "all", ""] },
        is_paginated: { type: 'string' },
        sort_by: { type: 'string' },
        order: { type: 'string' },
        location_id: { type: 'string' },
        is_nukhba_user: {type: 'integer',enum:[ ...Object.values(IS_NUKHBA_USER) ]},
        booking_id: { type: 'string' },
        campaign_code: { type: 'string' },
        coupon_discount: { type: 'string' },
        slot_discount: { type: 'string' },
        coupon_code: { type: 'string' },
        user_email_mobile: { type: 'string' },
        coupon_applied: { type: 'string', enum: [Bit.one, Bit.zero].map(String) },
      },
      required: [],
    }
  }

  const instantPaymentListSchema = {
    query: {
      type: 'object',
      properties: {
        page: { type: 'string' },
        page_size: { type: 'string' },
        is_paginated: { type: 'string' },
        reservation_id: { type: 'string' },
        restaurant_id: { type: 'string' },
        restaurant_name: { type: 'string' },
        from_date: { type: 'string' },
        ro_date: { type: 'string' },
        order_status_code: { type:'integer', enum: [...Object.values(OrderStatusCode),PaymentStatus.clickedBack.value] }
      },
      required: [],
    }
  }
  
  module.exports = {
    getReservationList,
    instantPaymentListSchema
  };
const { CASHOUT_APPROVED_STATUS } = require("../../constants/database");

const listCashoutRequest = {
  query:{
    type: 'object',
    properties: {
      page: { type: 'number' },
      page_size: { type: 'number' },
      is_paginated: { type: 'string' },
      sort_by: { type: 'string' },
      order: { type: 'string' },
      keyword: { type: 'string' },
      from_date: { type: 'string' },
      to_date: { type: 'string' },
    },
    required: [],
  },
}

const updateApproveStatus = {
  body:{
    type: 'object',
    properties: {
      id: { type: 'string', minLength: 3 },
      approved_status: { type: 'number', enum: [...Object.values(CASHOUT_APPROVED_STATUS)] },
    },
    required: ['id', 'approved_status'],
  },
}

module.exports = {
  listCashoutRequest,
  updateApproveStatus,
};
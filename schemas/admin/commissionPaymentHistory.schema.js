const { 
  Status,
  PaymentModes 
} = require("../../constants/database");

const get = {
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

const add = {
  body:{
    type: 'object',
    properties: {
      amount: { type: 'number' },
      from_date: { type: 'string', minLength: 3 },
      to_date: { type: 'string', minLength: 3 },
      payment_date: { type: 'string', minLength: 3 },
      res_id: { type: 'string', minLength: 3 },
      other_details: { type: 'object' },
      payment_mode: { type: 'number', enum: Object.values(PaymentModes) },
      ref_txn_id: { type: 'string' },
    },
    required: ['amount', 'from_date', 'to_date', 'payment_date', 'res_id', 'payment_mode' ],
  },
}

const update = {
  body:{
    type: 'object',
    properties: {
      id: { type: 'string', minLength: 3 },
      amount: { type: 'number' },
      from_date: { type: 'string', minLength: 3 },
      to_date: { type: 'string', minLength: 3 },
      payment_date: { type: 'string', minLength: 3 },
      // res_id: { type: 'number', minLength: 3 },
      other_details: { type: 'object' },
      payment_mode: { type: 'number', enum: [...Object.values(PaymentModes), ''] },
      ref_txn_id: { type: 'string' },
    },
    required: ['id'],
  },
}

const deleteEntity = {
  body:{
    type: 'object',
    properties: {
      id: { type: 'string', minLength: 3 },
    },
    required: ['id'],
  },
}

module.exports = {
  get,
  add,
  update,
  deleteEntity
};

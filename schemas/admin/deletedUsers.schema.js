const { Status } = require("../../constants/database");

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

const update = {
  body:{
    type: 'object',
    properties: {
      id: { type: 'string', minLength: 3 },
      status: { type: 'number', enum: [...Object.values(Status), ''] },
    },
    required: ['id'],
  },
}

module.exports = {
  get,
  update
};
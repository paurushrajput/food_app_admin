const { 
  Status,
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
      status: { type: 'string', enum: [...Object.values(Status).map(el=> el.toString()), ""] },
    },
    required: [],
  },
}

const add = {
  body:{
    type: 'object',
    properties: {
      user_id: { type: 'number' },
      role_id: { type: 'string', minLength: 3 },
    },
    required: ['user_id', 'role_id'],
  },
}

const update = {
  body:{
    type: 'object',
    properties: {
      id: { type: 'string', minLength: 3 },
      user_id: { type: 'string'},
      role_id: { type: 'string'},
      status: { type: 'number', enum: [...Object.values(Status), ''] },
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

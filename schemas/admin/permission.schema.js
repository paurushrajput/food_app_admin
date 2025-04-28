const { 
  Status,
  PERMISSION_TYPE
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
      module_id: { type: 'string', minLength: 3 },
      type: { type: 'string', enum: [...Object.values(PERMISSION_TYPE)] },
    },
    required: ['module_id', 'type'],
  },
}

const update = {
  body:{
    type: 'object',
    properties: {
      id: { type: 'string', minLength: 3 },
      module_id: { type: 'string', minLength: 3 },
      type: { type: 'string', enum: [...Object.values(PERMISSION_TYPE), ""] },
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

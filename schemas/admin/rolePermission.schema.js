const {
  Status,
  PERMISSION_TYPE,
  Bit
} = require("../../constants/database");

const get = {
  query: {
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
      status: { type: 'string', enum: [...Object.values(Status).map(el => el.toString()), ""] },
    },
    required: [],
  },
}

const add = {
  body: {
    type: 'object',
    properties: {
      permissions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            permission_id: { type: 'string', minLength: 3 },
            role_id: { type: 'string', minLength: 3 },
          },
          required: ['permission_id', 'role_id'],
        },
      }
    },
    required: ['permissions']
  },
}

// const update = {
//   body: {
//     type: 'object',
// properties: {
//   id: { type: 'string', minLength: 3 },
//   permission_id: { type: 'string', minLength: 3 },
//   role_id: { type: 'string', minLength: 3 },
// },
//     required: ['id'],
//   },
// }

const update = {
  body: {
    type: 'object',
    properties: {
      permissions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', minLength: 3 },
            permission_id: { type: 'string', minLength: 3 },
            role_id: { type: 'string', minLength: 3 },
            del: { type: 'integer', enum: [Bit.one, Bit.zero] },
          },
          required: ['id']
        }
      },
    },
    required: ['permissions'],
  },
}

const deleteEntity = {
  body: {
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

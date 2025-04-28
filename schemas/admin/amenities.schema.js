const { Status } = require("../../constants/database");

const getAmenitiesList = {
  query: {
    type: 'object',
    properties: {
      page: { type: 'string' },
      page_size: { type: 'string' },
      keyword: { type: 'string' },
      is_paginated: { type: 'string' },
      sort_by: { type: 'string' },
      order: { type: 'string' },
      status: { type: 'string', enum: [...Object.values(Status).map(el=> el.toString()), ""] },
    },
    required: [],
  }
}

const add = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      icon: { type: 'string' },
    },
    required: ['name'],
  }
}

const update = {
  body: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      status: { type: 'number' },
      icon: { type: 'string' },
    },
    required: ['id'],
  }
}
module.exports = {
  getAmenitiesList,
  add,
  update
};

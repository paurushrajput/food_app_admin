
const getDinningsList = {
  query: {
    type: 'object',
    properties: {
      page: { type: 'string' },
      page_size: { type: 'string' },
      keyword: { type: 'string' },
      is_paginated: { type: 'string' },
      sort_by: { type: 'string' },
      order: { type: 'string' },
    },
    required: [],
  }
}

const add = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
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
    },
    required: ['id'],
  }
}
module.exports = {
  getDinningsList,
  add,
  update
};

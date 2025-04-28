const { WinnerBreakupType } = require("../../constants/variables");

const insertWinnerBreakup = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      break_up: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            rank: { type: 'number' },
            image: { type: 'string', minLength: 1, maxLength: 100 }
          },
          required: ['rank', 'image'],
        }
      },
    },
    required: ['name', 'break_up'],
  }
}

const updateWinnerBreakup = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      breakup_id: { type: 'string', minLength: 1, maxLength: 100 },
      break_up: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            rank: { type: 'number' },
            image: { type: 'string', minLength: 1, maxLength: 100 }
          },
          required: ['rank', 'image'],
        }
      },
    },
    required: ['breakup_id'],
  }
}

const deleteWinnerBreakup = {
  body: {
    type: 'object',
    properties: {
      breakup_id: { type: 'string', minLength: 1, maxLength: 100 },
    },
    required: ['breakup_id'],
  }
}

const winnerBreakupListAndFilter = {
  query: {
    type: 'object',
    properties: {
      page: { type: 'string' },
      page_size: { type: 'string' },
      is_paginated: { type: 'string' },
      sort_by: { type: 'string' },
      order: { type: 'string' },
      name: { type: 'string', minLength: 1, maxLength: 100 }, // Accepts either 'cuisine' or 'theme'
    },
    required: [],
  }
}

module.exports = {
  insertWinnerBreakup,
  updateWinnerBreakup,
  deleteWinnerBreakup,
  winnerBreakupListAndFilter
};
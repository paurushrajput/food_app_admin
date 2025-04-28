const { 
  Status,
  StoriesType,
  STORIES_SCREEN_TYPE
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
      image_id: { type: 'string', minLength: 3 },
      title: { type: 'string' },
      duration: { type: 'number' },
      type: { type: 'number', enum: Object.values(StoriesType) },
      sequence: { type: 'number' },
    },
    required: ['image_id', 'type', 'duration'],
  },
}

const update = {
  body:{
    type: 'object',
    properties: {
      id: { type: 'string', minLength: 3 },
      image_id: { type: 'string' },
      title: { type: 'string' },
      duration: { type: 'number' },
      type: { type: 'number', enum: [...Object.values(StoriesType), ''] },
      status: { type: 'number', enum: [...Object.values(Status), ''] },
      sequence: { type: 'number' },
    },
    required: ['id'],
  },
}

const updateBulk = {
  body:{
    type: 'object',
    properties: {
      stories: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', minLength: 3 },
            image_id: { type: 'string' },
            title: { type: 'string' },
            duration: { type: 'number' },
            type: { type: 'number', enum: [...Object.values(StoriesType), ''] },
            status: { type: 'number', enum: [...Object.values(Status), ''] },
            sequence: { type: 'number' },
          },
          required: ['id'],
        }
      }
      
    },
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
  updateBulk,
  deleteEntity
};

const getReviewsList = {
    query: {
      type: 'object',
      properties: {
        page: { type: 'string' },
        page_size: { type: 'string' },
        keyword: { type: 'string' },
        is_paginated: { type: 'string' },
        sort_by: { type: 'string' },
        order: { type: 'string' },
        res_uid: {type:'string'}
      },
      required: [],
    }
  }
  
  module.exports = {
    getReviewsList
  };
  
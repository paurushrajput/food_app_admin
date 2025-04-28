const updateImage = {
  body: {
      type: 'string',
      properties: {
          file: {type: "string"}
        
      },
      required:['file']
  }
}


const mediaList = {
    query: {
        type: 'object',
        properties: {
            page: { type: 'string' },
            page_size: { type: 'string' },
            is_paginated: { type: 'string' },
            type: { type: 'string' },
        },
        required: [],
    }
}
module.exports = {
    updateImage,
    mediaList
}
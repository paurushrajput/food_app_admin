const { CategoryType, Status } = require("../../constants/database");

const categoryList = {
  query: {
    type: 'object',
    properties: {
      page: { type: 'string'},
      page_size: { type: 'string'},
      is_paginated: {type: 'string'},
      sort_by: {type: 'string'},
      order: {type: 'string'},
      name: {type: 'string'},
      type: { type: 'string', enum: [...Object.keys(CategoryType), ""] }, // Accepts either 'cuisine' or 'theme'
      status: { type: 'string', enum: [...Object.values(Status).map(el=> el.toString()), ""] },
    },
    required:[],
  }
}

const updateImage = {
  params: {
    type: "object",
    properties: {
       category_uid: {type: "string"}
    },
    required:[]
}, 
body: {
    type: 'string',
    properties: {
        file: {type: "string"}
      
    },
    required:['file']
}
}

const insertCategory = {
  body: {
    type: 'object',
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 255},
        icon: { type: 'string', maxLength: 500 },
        type: { type: 'string', enum: Object.keys(CategoryType) },
        status: { type: 'integer', enum: [0, 1] }, // Assuming status is either 0 or 1
    },    
    required:['name', 'type'],  
  }
}

const update = {
  query: {
      
  },
  params: {
    type: 'object',
    properties: {
      uid: { type: 'string' },
    },
    required: ['uid'],
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 255},
      icon: { type: 'string', maxLength: 500 },
      type: { type: 'string', enum: [...Object.keys(CategoryType), ""] },
      status: { type: 'integer', enum: [0, 1] }
  },
    required: [],
  }
}

const updateSequence = {
  body: {
      type: 'object',
      properties: {
        categories: {
              type: 'array',
              items: {
                  type: 'object',
                  properties: {
                      id: { type: 'string' },
                      sequence: { type: 'integer', minimum: 1 },
                  },
                  required: ['id', 'sequence'],
              }
          }
      },
      required: ['categories'],
  }
}


      
module.exports = {
    categoryList,
    insertCategory,
    update,
    updateImage,
    updateSequence
  };
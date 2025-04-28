const { Status, Bit } = require("../../constants/database");

const updateStatus = {
  query: {
      
  },
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
  body: {
    type: 'object',
    properties: {
      status: { type: 'string' },
    },
    required: ['status'],
  }
}

const listCountries = {
  query:{

  },
}

const listCitiesByCountryId = {
  query:{
    type:'object',
    properties:{
      page: { type: 'string'},
      page_size: { type: 'string'},
      is_paginated: {type: 'string'},
      country_id: { type: 'string' },
    }
  }
}

const updateImage = {
  params: {
    type: "object",
    properties: {
       location_uid: {type: "string"}
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

const updateLocation = {
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
      name: { type: 'string', minLength: 1, maxLength: 255 },
      icon: { type: 'string', maxLength: 500 },
      city_id: { type: 'integer' },
      country_id: { type: 'integer' },
      operational: { type: 'integer', enum: [0, 1] },
      status: { type: 'string'}, // Assuming status is either 0 or 1
        },
    required: [],
  }
}

const locationList = {
  query: {
    type: 'object',
    properties: {
      page: { type: 'string'},
      page_size: { type: 'string'},
      city_id: {type: 'string'},
      country_id: {type: 'string'},
      is_paginated: {type: 'string'},
      sort_by: {type: 'string'},
      order: {type: 'string'},
      status: { type: 'string', enum: [...Object.values(Status).map(el=> el.toString()), ""] },
    },
    required:[],
  }
}

const insertLocation = {
  body:{
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 255 },
      icon: { type: 'string', maxLength: 500 },
      city_id: { type: 'integer' },
      country_id: { type: 'integer' },
      operational: { type: 'integer', enum: Object.values(Bit) },
      status: { type: 'integer', enum: Object.values(Status) }, // Assuming status is either 0 or 1
    },
    required: ['name', 'country_id', 'city_id', 'status'],
  }
};


module.exports = {
  updateStatus,
  locationList,
  insertLocation,
  updateLocation,
  listCountries,
  listCitiesByCountryId,
  updateImage
};

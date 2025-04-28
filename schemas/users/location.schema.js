const getCountryList = {
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

const getStateList = {
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
  },
  params: {
    type: 'object',
    properties: {
      country_id: { type: 'string' },
    },
    required: [],
  },
}

const getCitiesByCountry = {
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
  },
  params: {
    type: 'object',
    properties: {
      country_id: { type: 'string' },
    },
    required: [],
  },
}


const getRestaurantByLocation = {
  query: {
    type: 'object',
    properties: {
      location_id: { type: 'string' },
    },
    required: ['location_id'],
  }
}

const getRestaurantByLocationAndRestaurant = {
  query: {
    type: 'object',
    properties: {
      location_id: { type: 'string' },
      restaurant_id: { type: 'string' },
    },
    required: ['location_id', 'restaurant_id'],
  }
}

module.exports = {
  getCountryList, getStateList, getCitiesByCountry, getRestaurantByLocation, getRestaurantByLocationAndRestaurant
};

const { Bit, Logins } = require("../../constants/database");

const getList = {
  query: {
    type: 'object',
    properties: {
      from_date: { type: 'string' },
      to_date: { type: 'string' },
      is_nukhba_user: { type: 'integer', enum: [Bit.one, Bit.zero] },
    },
    required: [],
  }
}

const add = {
  body: {
    type: 'object',
    properties: {
      log_date: { type: 'string' },
      forceUpdate: { type: 'boolean' },
      is_nukhba_user: { type: 'integer', enum: [Bit.one, Bit.zero] },
    },
    required: [],
  }
}

const userList = {
  query: {
    type: 'object',
    properties: {
      from_date: { type: 'string' },
      to_date: { type: 'string' },
      device_type: { type: 'string', enum: [...Object.values(Logins.DeviceType)] },
    },
    required: ['device_type'],
  }
}


module.exports = {
  getList,
  add,
  userList
};

const {
  CAMPAIGN_ACTION,
  CAMPAIGN_COMMISSION_TYPE,
  Status,
  DIALOG_USER_TYPE,
  DIALOG_ACTION_TYPE,
  Bit,
  DIALOG_TYPE
} = require("../../constants/database");

const get = {
  query: {
    type: "object",
    properties: {
      page: { type: "string" },
      page_size: { type: "string" },
      is_paginated: { type: "string" },
      sort_by: { type: "string" },
      order: { type: "string" },
      keyword: { type: "string" },
      from_date: { type: "string" },
      to_date: { type: "string" },
      status: {
        type: "string",
        enum: [...Object.values(Status).map((el) => el.toString()), ""],
      },
    },
    required: [],
  },
};

const add = {
  body: {
    type: "object",
    properties: {
      title: { type: "string", minLength: 3 },
      message: { type: "string" },
      button_name: { type: "string" },
      action: { type: "string" },
      action_type: { type: "integer", enum: Object.values(DIALOG_ACTION_TYPE)?.map(elem => elem.action_key) },
      start_time: { type: "integer" },
      end_time: { type: "integer" },
      user_type: { type: "integer", enum: [...Object.values(DIALOG_USER_TYPE)] },
      status: { type: 'integer', enum: [...Object.values(Status)] },
      res_id: { type: 'string' },
      campaign_id: { type: 'string' },
      coupon_id: { type: 'string' },
      is_coupon_used: { type: 'integer', enum: [Bit.one, Bit.zero] },
      on_boarding_start: { type: 'string' },
      on_boarding_end: { type: 'string' },
      user_ids: { type: 'array' },
      type: { type: 'integer', enum: [...Object.values(DIALOG_TYPE)] },
    },
    required: ["title", "user_type", "action", "action_type"],
  },
};

const update = {
  body: {
    type: "object",
    properties: {
      id: { type: "string", minLength: 3 },
      title: { type: "string", minLength: 3 },
      message: { type: "string", minLength: 5 },
      button_name: { type: "string" },
      action: { type: "string" },
      action_type: { type: "integer", enum: Object.values(DIALOG_ACTION_TYPE)?.map(elem => elem.action_key) },
      start_time: { type: "integer" },
      end_time: { type: "integer" },
      user_type: { type: "integer", enum: [...Object.values(DIALOG_USER_TYPE)] },
      status: { type: 'integer', enum: [...Object.values(Status)] },
      res_id: { type: 'string' },
      campaign_id: { type: 'string' },
      coupon_id: { type: 'string' },
      is_coupon_used: { type: 'integer', enum: [Bit.one, Bit.zero] },
      on_boarding_start: { type: 'string' },
      on_boarding_end: { type: 'string' },
      user_list: { type: 'integer', enum: [Bit.one, Bit.zero] },
      user_ids: { type: 'array' },
    },
    required: ["id"],
  },
};

const deleteEntity = {
  body: {
    type: "object",
    properties: {
      id: { type: "string", minLength: 3 },
    },
    required: ["id"],
  },
};
module.exports = {
  get,
  add,
  update,
  deleteEntity,
};

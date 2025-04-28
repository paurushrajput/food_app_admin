const {
  CAMPAIGN_ACTION,
  CAMPAIGN_COMMISSION_TYPE,
  Status
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
      start_date: { type: "number" },
      end_date: { type: "number" },
      commission_type: {
        type: "number",
        enum: Object.values(CAMPAIGN_COMMISSION_TYPE),
      },
      commission_amount: { type: "number" },
      agent_id: { type: "string" },
      coupon_id: { type: "string" },
      action: { type: "number", enum: Object.values(CAMPAIGN_ACTION) },
    },
    required: ["title", "start_date", "end_date"],
  },
};

const update = {
  body: {
    type: "object",
    properties: {
      id: { type: "string", minLength: 3 },
      title: { type: "string", minLength: 3 },
      start_date: { type: "number" },
      end_date: { type: "number" },
      commission_type: {
        type: "number",
        enum: Object.values(CAMPAIGN_COMMISSION_TYPE),
      },
      commission_amount: { type: "number" },
      agent_id: { type: "string" },
      coupon_id: { type: "string" },
      action: { type: "number", enum: Object.values(CAMPAIGN_ACTION) },
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

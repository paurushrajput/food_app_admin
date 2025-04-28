const { 
  TournamentStatus,
  TournamentRewardType,
  TournamentEntryType,
  TournamentType 
} = require("../../constants/tournaments");

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
      status: { type: 'string', enum: [...Object.values(TournamentStatus).map(el=> el.toString()), ""] },
    },
    required: [],
  },
}

const add = {
  body:{
    type: 'object',
    properties: {
      game_id: { type: 'string', minLength: 3 },
      game_url: { type: 'string', minLength: 3 },
      image_id: { type: 'string' },
      title: { type: 'string', minLength: 1 },
      date_start: { type: 'number' },
      date_end: { type: 'number' },
      reward_type: { type: 'number', enum: Object.values(TournamentRewardType) },
      winner_breakup_id: { type: 'string', minLength: 3 },
      tournament_rule_id: { type: 'string', minLength: 3 },
      min_user: { type: 'number' },
      max_user: { type: 'number' },
      entry_fee: { type: 'number' },
      total_winning_amount: { type: 'number' },
      entry_type: { type: 'number', enum: Object.values(TournamentEntryType) },
      type: { type: 'number', enum: Object.values(TournamentType) },
      user_referral_points: { type: 'number' },
      image_on_redeem_page: { type:'string'}
    },
    required: ['game_id', 'game_url', 'title', 'date_start', 'date_end', 'winner_breakup_id', 'tournament_rule_id'],
  },
}

const update = {
  body:{
    type: 'object',
    properties: {
      id: { type: 'string', minLength: 3 },
      title: { type: 'string' },
      image_id: { type: 'string' },
      date_start: { type: 'number' },
      date_end: { type: 'number' },
      reward_type: { type: 'number', enum: [...Object.values(TournamentRewardType), ''] },
      winner_breakdown_id: { type: 'string' },
      tournament_rule_id: { type: 'string' },
      min_user: { type: 'number' },
      max_user: { type: 'number' },
      entry_fee: { type: 'number' },
      total_winning_amount: { type: 'number' },
      entry_type: { type: 'number', enum: [...Object.values(TournamentEntryType), ''] },
      type: { type: 'number', enum: [...Object.values(TournamentType), ''] },
      user_referral_points: { type: 'number' },
      status: { type: 'number', enum: [...Object.values(TournamentStatus), ''] },
      image_on_redeem_page: { type : 'string'}
    },
    required: ['id'],
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
  deleteEntity
};

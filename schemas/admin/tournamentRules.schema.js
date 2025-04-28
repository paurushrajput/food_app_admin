const maxLength = 100;
const minLength = 1;

const tournamentRulesAndFilter = {
  query: {
    type: 'object',
    properties: {
      page: { type: 'string' },
      page_size: { type: 'string' },
      is_paginated: { type: 'string' },
      sort_by: { type: 'string' },
      order: { type: 'string' },
      name: { type: 'string', minLength, maxLength },
    },
    required: [],
  }
}

const addTournamentRuleLeaderboard = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength, maxLength },
      rule: { type: 'array' },
    },
    required: ['name', 'rule'],
  }
}

const updateTournamentRuleLeaderboard = {
  body: {
    type: 'object',
    properties: {
      rule_id: { type: 'string', minLength, maxLength },
      name: { type: 'string', minLength, maxLength },
      rule: { type: 'array' },
    },
    required: ['rule_id'],
  }
}

const deleteTournamentRuleLeaderboard = {
  body: {
    type: 'object',
    properties: {
      rule_id: { type: 'string', minLength, maxLength },
    },
    required: ['rule_id'],
  }
}

module.exports = {
  tournamentRulesAndFilter,
  addTournamentRuleLeaderboard,
  updateTournamentRuleLeaderboard,
  deleteTournamentRuleLeaderboard
};

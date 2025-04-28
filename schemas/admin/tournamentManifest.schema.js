const maxLength = 100;
const minLength = 1;

const tournamentManifestAndFilter = {
  query: {
    type: 'object',
    properties: {
      page: { type: 'string' },
      page_size: { type: 'string' },
      is_paginated: { type: 'string' },
      sort_by: { type: 'string' },
      order: { type: 'string' },
      tournament: { type: 'string', minLength, maxLength },
      user_data: { type: 'string', minLength, maxLength },
    },
    required: [],
  }
}

const updateTournamentLeaderboard = {
  body: {
    type: 'object',
    properties: {
      tournament_id: { type: 'string', minLength, maxLength },
    },
    required: [],
  }
}

const getTournamentLeaderboard = {
  query: {
    type: 'object',
    properties: {
      tournament_id: { type: 'string', minLength, maxLength },
    },
    required: ['tournament_id'],
  }
}

module.exports = {
  tournamentManifestAndFilter,
  updateTournamentLeaderboard,
  getTournamentLeaderboard
};

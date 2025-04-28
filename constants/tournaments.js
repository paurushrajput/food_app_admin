const TournamentStatus = {
  scheduled: 1,
  live: 2,
  completed: 3,
  abandoned: 4
}

const TournamentRewardType = {
  points: 2,
}

const TournamentEntryType = {
  paid: 1,
  free: 2,
}

const TournamentType = {
  referral: 1,
  booking: 2,
  referral_game: 3
}

const USER_REFERRAL_POINTS = 150

module.exports = {
  TournamentStatus,
  TournamentRewardType,
  TournamentEntryType,
  TournamentType,
  USER_REFERRAL_POINTS
}
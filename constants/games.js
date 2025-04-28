const GameUrls = {
  GET_GAME_URL:`${process.env.SERVERLESS_BASE_URL}/dev/user/login`,
  GET_CLIENT_GAMES_URL:`${process.env.SERVERLESS_BASE_URL}/dev/user/login1`,
  GET_CLIENT_GAMES_LIST:`${process.env.SERVERLESS_BASE_URL}/dev/user/get-client-games-by-client`,
  GET_USER_GAMES_LIST:`${process.env.SERVERLESS_BASE_URL}/dev/user/get-user-games`,
  PLAY_GAME_URL:`${process.env.SERVERLESS_BASE_URL}/dev/user/play-game`
}

module.exports = {
  GameUrls
}
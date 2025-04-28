const BannerType = {
  restaurant: { title: 'Restaurant', value: "nukhbaLink?screen=restaurant", key: "restaurant" },
  game: { title: 'Game Play', value: "nukhbaLink?screen=game", key: "game"  },
  shareapp: { title: 'Share App', value: "nukhbaLink?screen=shareapp", key: "shareapp"  },
  manual: { title: 'Mannual', value: "nukhbaLink?screen=", key: "manual"  }
}

const BannerSize = {
  small: "small",
  big: "big"
}

const BANNER_SCREEN_TYPE = {
  HOME: 'home',
  MORE_PAGE: 'morepage',
}

module.exports = {
  BannerType,
  BannerSize,
  BANNER_SCREEN_TYPE
}
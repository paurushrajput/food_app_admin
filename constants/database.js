const Tables = {
    COUNTRIES: "countries",
    CITIES: "cities",
    STATES: "states",
    USERS: "users",
    ROLES: "roles",
    USER_ROLES: "user_roles",
    LOGINS: "logins",
    USER_FAVS: "user_favs",
    RESTAURANTS: "restaurants",
    LOCATION: "locations",
    CATEGORIES: "categories",
    RESTAURANT_CATEGORIES: "restaurant_categories",
    BRANDS: "brands",
    SLOTS: "slots",
    RESERVATIONS: "reservations",
    AMENITIES: "amenities",
    RESTAURANT_AMENITIES: "restaurant_amenities",
    REVIEWS: "user_reviews",
    DINNINGS: "dinnings",
    RESTAURANT_DINNINGS: "restaurant_dinnings",
    ADMIN: "admin",
    MERCHANTS: "merchants",
    MEDIA: "media",
    BANNER: "banner",
    APPCONFIG: "app_config",
    NOTIFICATION_MASTER: "notification_master",
    USER_NOTIFICATION: "user_notification",
    USER_TICKET: "user_tickets",
    DELETED_USERS: "deleted_users",
    WINNER_BREAKUP: "winner_breakup",
    TOURNAMENT_RULES: "tournament_rules",
    TOURNAMENT_MANIFEST: "tournament_manifest",
    TOURNAMENTS: "tournaments",
    STORIES: "stories",
    APP_SETTINGS: "app_settings",
    COMMISSION_PAYMENT_HISTORY: "commission_payment_history",
    RESTAURANT_OPERATIONAL_HOURS: "restaurant_operational_hours",
    PAYMENTS: "payments",
    REFUNDS: "refunds",
    ORGANIZATIONS: "organizations",
    COUPONS: "coupons",
    COUPON_REDEEM: "coupon_redeem",
    USER_POINTS: "user_points",
    NOTIFICATION_TEMPLATE: "notification_template",
    NUKHBA_STORE: "nukhba_store",
    DAILY_REPORT: 'daily_report',
    CAMPAIGN: "campaign",
    DIALOG: "dialog",
    DIALOG_USER: "dialog_user",
    DEALS: "deals",
    DEAL_OPTION: "deal_option",
    USER_DEAL: "user_deal",
    AGENT_COMMISSION: "agent_commission",
    ADMIN_LOGINS: "admin_logins",
    MODULES: "modules",
    PERMISSIONS: "permissions",
    ROLE_PERMISSION: "role_permission",
    USER_COUPONS: "user_coupons",
    DEAL_SLOT: "deal_slot",
    DEAL_CATEGORIES: "deal_categories",
    USER_INVITES: "user_invites",
    INFLUENCERS:"influencers",
    USER_EVENTS: "user_events",
    USER_CREDITS: "user_credits",
    USER_WALLET: "user_wallet",
    WAYS_TO_EARN:"ways_to_earn",
    FEEDS:"feeds",
    LIKE:"likes",
    COMMENT:"comments"
}

const Logins = {
    DeviceType: {
        ANDROID: "android",
        iOS: "ios",
        WEB: "web",
    }
}

const MerchantType = {
    VERIFIED: "verified",
    UNVERIFIED: "unverified",
}
const RestaurantApproval = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
}
const UnknownUser = 'N/A';
const Status = {
    one: 1,
    zero: 0,
}
const Operations = {
    INSERT: "INSERT",
    UPDATE: "UPDATE",
    DELETE: "DELETE",
    SELECT: "SELECT",
}

const Bit = {
    one: 1,
    zero: 0,
    two: 2
}
const UserStatus = {
    active: 1,
    deleted: 0,
    blocked: -1,
    suspended: -2,
    noshow: -3
}

const BookingType = {
    UPCOMING: "upcoming",
    HISTORICAL: "historical",
    CANCELLED: "cancelled",
    NOSHOW: "noshow",
    COMPLETED: "completed",
    PAYMENT_COMPLETED: "payment_completed",
    REFUNDED: "refunded",
}

const BookingCancelType = {
    USER_ASKED_ME_TO_CANCEL: "user_asked_me_to_cancel",
    THE_RESTAURANT_WAS_CLOSED: "the_restaurant_was_closed",
    FOOD_APP_ASKED_ME_T0_CANCEL: "food_app_asked_me_to_cancel",
    OTHERS: "others"
}
const BookingStatus = {
    UPCOMING: "Upcoming",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled"
}
const ReservationTrackStatus = [
    { text: "Upcoming", key: 'active', value: 1 },
    { text: "Approved", key: 'approved', value: 2 },
    { text: "Arrived", key: 'arrived', value: 3 },
    { text: "Payment Completed", key: 'payment_completed', value: 4 },
    { text: "Completed", key: 'completed', value: 5 },
    { text: "Deleted", key: 'deleted', value: 0 },
    { text: "Cancelled by Merchant", key: 'rejected', value: -1 },
    { text: "Cancelled by User", key: 'cancelled', value: -2 },
    { text: "No Show", key: 'noshow', value: -3 },
    { text: "Pending", key: 'pending', value: -4 },
    { text: "Booking Not Accepted", key: 'booking_not_accepted', value: -5 },
    { text: "Auto Cancelled", key: 'auto_cancelled', value: -6 },
    { text: "Payment Pending", key: 'payment_pending', value: -7 },
    { text: "Cancelled by Admin", key: 'rejected_by_admin', value: -8 },
]

const BookingTrackStatus = {
    active: 1,
    approved: 2,
    arrived: 3,
    payment_completed: 4,
    completed: 5,
    deleted: 0,
    rejected: -1,
    cancelled: -2,
    noshow: -3,
    pending: -4,
    booking_not_accepted: -5,
    auto_cancelled: -6,
    payment_pending: -7,
    rejected_by_admin: -8,
}

const RowStatus = {
    active: "Yes",
    inactive: "No",
}
const MerchantStatus = {
    active: 1,
    deleted: 0,
    blocked: -1,
    suspended: -2,
}

const RestaurantStatus = {
    active: 1,
    inactive: 0
}

const NotificationTopicType = {
    FCM_ALL: {
        topic: 'food_app_all',
        type: 1
    },
}

const NotificationDeviceType = {
    ANDROID: 1,
    iOS: 2,
    WEB: 3,
}

const Currency = {
    AED: 'AED',
}

const CurrencyType = {
    FLAT: "flat",
    PERCENT: "percent"
}

const StoriesType = {
    home: 1,
    signup: 2,
    morepage: 3,
}

const PaymentModes = {
    online: 1,
    cheque: 2,
    autodebit: 3,
    cash: 4
}

const Pagination = {
    defaultPage: 1,
    pageSize: 10,
    defaultSortColumn: 'created_at',
    defaultOrder: 'desc'
}

const UserTicketsType = {
    BOOKING: "booking",
    REFERRAL: "referral",
    LOGIN: "login"
}

const CategoryType = {
    cuisine: "cuisine",
    theme: 'theme',
    deal: 'deal',
    ALLERGY: "allergy"
}

const ImageFileTypes = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpg',
    png: 'image/png',
    gif: 'image/gif'
}

const SlotsStatus = {
    ACTIVE: 1,
    CLOSED: 2
}

const FilterCondnType = {
    history: "history",
    three_months: "three_months",
    current_month: "current_month",
    today: "today",
    byDate: "byDate"
}

const OrganizationStatus = {
    enabled: 1,
    disabled: 0,
}

const CouponType = {
    organization: 1,
    global: 2,
    user: 3,
    store: 4,
    campaign: 5,
    agent: 6,
    referral: 7,
}

const CouponStatus = {
    enabled: 1,
    disabled: 0,
    expired: 2
}

const CouponDiscountType = {
    FLAT: 'flat',
    PERCENTAGE: 'percentage'
}

const NukhbaStoreType = {
    1: 'coupon',
    2: 'product'
}

const IS_NUKHBA_USER = {
    "1": 1,
    "0": 0,
}

const BOOKING_COUNT_ENUM = [0, 1, 2, 3, 4, 5]

const STORIES_SCREEN_TYPE = {
    HOME: 'home',
    MORE_PAGE: 'morepage',
}

const APP_CONFIG_TITLE = {
    ANDROID_UPDATE: "android_update",
    IOS_UPDATE: "ios_update",
    EXTERNAL_LINK: "external_links",
    CONTACT_US: "contact_us",
    GUEST_WHITE_LIST: "guest_user_whitelist_api",
    SYSTEM_USER: "system_users",
    SKIP_SETTING: "skip_setting",
    ACTIVITY_SETTING: "activity_setting",
}

const CAMPAIGN_COMMISSION_TYPE = {
    FLAT: 0
}

const CAMPAIGN_ACTION = {
    CPR: 0,                //cpr-> cost per registration / signup
    CPV: 1,                 //cpv -> cost per paid mobile verification / signup
    // CPPD: 2                 //cppb -> cost per paid booking / dinning -------------->>>>>>>>> Payment completed
}

// its values are different in food app
const USER_TYPE = {
    DEFAULT: 0,
    AGENT: 1,
    INFLUENCER:2
}

const RESERVATION_TYPE = {
    DASHBOARD: "dashboard",
    RESERVATION: "reservation"
}

const DIALOG_USER_TYPE = {
    SPECIFIC_USER: 0,
    ALL_USER: 1
}

const DIALOG_ACTION_TYPE = {
    RESTAURANT: { title: 'Restaurant', action_key: 1, value: "nukhbaLink?screen=restaurant", key: "restaurant" },
    GAME: { title: 'Game Play', action_key: 2, value: "nukhbaLink?screen=game", key: "game" },
    SHARE_APP: { title: 'Share App', action_key: 3, value: "nukhbaLink?screen=shareapp", key: "shareapp" },
    MANUAL: { title: 'Manual', action_key: 4, value: "nukhbaLink?screen=", key: "manual" },
    VOUCHER: { title: 'Voucher', action_key: 5, value: "nukhbaLink?screen=voucher", key: "voucher" },
    DEAL: { title: 'Deal', action_key: 6, value: "nukhbaLink?screen=deal", key: "voucher" }
}

const DIALOG_USER_READ = {
    READ: 1, // THIS IS DEFAULT VALUE
    NOT_READ: 0,
}


const CancelledBookingStatus = [BookingTrackStatus.auto_cancelled, /*BookingTrackStatus.cancelled,*/ BookingTrackStatus.rejected, BookingTrackStatus.rejected_by_admin]

const RESTAURANT_PAX_COMMISSION_TYPE = {
    fixed_per_pax: 1,
    varies_per_pax: 2,
    fixed_per_booking: 3,
}

const RESTAURANT_PAX_DETAILS = {
    fixed_per_pax: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    fixed_per_booking: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    max_guest_number: 7
}

const DIALOG_TYPE = {
    DIALOG: 1,
    NOTIFICATION: 2,
}

const PERMISSION_TYPE = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete'
}

const ADMIN_ROLE_TYPE = {
    SUPER_ADMIN: 1,
    SUB_ADMIN: 2

}

const UserDealStatus = {
    invalid: -3,
    expired: -2,
    auto_cancelled: -1,
    payment_pending: 1,
    payment_completed: 2,
    redeemed: 3,
}

const DEAL_TYPE = {
    FREE: 'free',
    PAID: 'paid',
    PAY_AT_RESTRO:'pay_at_resto'
}
const PAY_AT_RESTRO_TEXT = "Pay at restro"

const RESTAURANT_TYPE = {
    ALL: 0,
    DEAL: 1,
    RESERVATION: 2
}

const RESTAURANT_LIST_TYPE = {
    DEFAULT: 'default',
    DEAL: 'deal',
    RESERVATION: 'reservation'
}


const PAYMENT_TYPE = {
    RESERVATION: 0,
    INSTANT_PAYMENT: 1
}

const RESERVATION_MESSAGE_TEMPLATE = {
    DEFAULT: 0,  //full payment
    ADVANCE_PAYMENT: 1,
}

const SLOT_TEMPLATE = {
    BOOKING_FEE: 0,
    ADVANCE_PAYMENT: 1,
}

const DEAL_COMMISSION_TYPE = {
    FIXED_PER_PAX: 1,
    VARIES_PER_PAX: 2,
    FIXED_PER_BOOKING: 3
}


const DEAL_TEMPLATE = {
    WITHOUT_SLOT: 0, // default value in database in accordance with old deals that exists
    WITH_SLOT: 1
}

const RestaurantOperationalFullDay = {
    Monday: 'mon',
    Tuesday: 'tue',
    Wednesday: 'wed',
    Thursday: 'thu',
    Friday: 'fri',
    Saturday: 'sat',
    Sunday: 'sun',
}

const NUKHBA_EMAIL_DOMAIN = "@nukhba.com"

const UserInvitesStatus = {
    skipped: -1,
    pending: 0,
    added: 1
}


const InviteStatus = {
    pending: 1,
    sent: 2,
    accepted: 3,
    rejected: 4,
}

const InfluencerApprovalStatus = {
    PENDING:0,
    APPROVED:1,
    REJECTED:2
}

const COMMISSION_TYPE = {
    FLAT: 'flat',
    PERCENTAGE: 'percentage'
}

const USER_EVENTS_TYPE = {
    PRE_BOOKING: 1,
    INSTANT_PAYMENT: 2,
    DEALS_PURCHASED: 3,
    REFERRAL: 4,
    REFERRED_USER_DINNING: 5,
    RESTAURANT_RATING: 6
}

const NUKHBA_POINTS = {
    REFERRAL: 2500,
    RESERVATIONS: 2500,
    INSTANT_PAYMENT: 1000,
    DEAL_PURCHASED: 2500,
    REF_FRIEND_FIRST_DINNING: 5000,
    RESTAURANT_RATING: 50,
}

const USER_POINTS_MONTHLY_LIMIT = {
    REFERRAL: 50,
    RESERVATIONS: 15,
    INSTANT_PAYMENT: 10,
    DEAL_PURCHASED: 10,
    REF_FRIEND_FIRST_DINNING: 50,
    RESTAURANT_RATING: 100,
}

const USER_CREDIT_STATUS = {
    PENDING: 0,
    PROCESSED: 1,
    COMPLETED: 2,
    EXPIRED: -1,
    FAILED: -2
}

const USER_CREDIT_TYPE = {
    ADD: 1,
    CASHOUT: -1,
}

const CASHOUT_APPROVED_STATUS = {
    PENDING: 0,
    APPROVED: 1,
    REJECTED: -1
}

const CASHOUT_TYPE = {
    POINTS: 1,
    CREDITS: 2,
}

const USER_POINTS_TYPE = {
    REFERRAL: "referral",
    RESERVATION: "reservation",
    INSTANT_PAYMENT: "instant_payment",
    DEAL_PURCHASED: "deal_purchased",
    REF_FRIEND_FIRST_DINNING: "ref_friend_first_dinning",
    RESTAURANT_RATING: "restaurant_rating",
    CONVERT: "convert",
    CASHOUT: "cashout",
    DAILY_REWARD: "daily_reward",
    INFLUENCER_COMMISSION_CREDIT: "influencer_commission_credit"
}

const POINT_TYPE_DESC = {
    "referral": { text: "Referral" },
    "reservation": { text: "Reservation" },
    "instant_payment": { text: "Instant Payment" },
    "deal_purchased": { text: "Deal Purchase" },
    "ref_friend_first_dinning": { text: "Referred Friend First Dining" },
    "restaurant_rating": { text: "Restaurant Rating" },
    "daily_reward": { text: "Daily Reward" },
}

const WP_MSG_DELIVERED_STATUS = {
    DELIVERED: 4,
    NOT_DELIVERED: -2,
    NON_UAE_NO: -3,
    NON_UAE_INVALID_PHONE: -4,
    NUM_NOT_ON_WP: -1,
    USER_REG: 3
}

const FEED_TYPE = {
    RATING:1,
    WISHLIST:2
}

module.exports = {
    Tables,
    Operations,
    Logins,
    Bit,
    UnknownUser,
    Status,
    RestaurantApproval,
    MerchantType,
    UserStatus,
    RowStatus,
    BookingType,
    ReservationTrackStatus,
    BookingCancelType,
    BookingStatus,
    MerchantStatus,
    RestaurantStatus,
    NotificationTopicType,
    NotificationDeviceType,
    Currency,
    BookingTrackStatus,
    CurrencyType,
    StoriesType,
    PaymentModes,
    Pagination,
    UserTicketsType,
    CategoryType,
    ImageFileTypes,
    SlotsStatus,
    FilterCondnType,
    OrganizationStatus,
    CouponType,
    CouponStatus,
    CouponDiscountType,
    NukhbaStoreType,
    IS_NUKHBA_USER,
    BOOKING_COUNT_ENUM,
    STORIES_SCREEN_TYPE,
    APP_CONFIG_TITLE,
    CAMPAIGN_COMMISSION_TYPE,
    CAMPAIGN_ACTION,
    USER_TYPE,
    RESERVATION_TYPE,
    CancelledBookingStatus,
    DIALOG_USER_TYPE,
    DIALOG_ACTION_TYPE,
    DIALOG_USER_READ,
    RESTAURANT_PAX_COMMISSION_TYPE,
    RESTAURANT_PAX_DETAILS,
    DIALOG_TYPE,
    PERMISSION_TYPE,
    ADMIN_ROLE_TYPE,
    UserDealStatus,
    DEAL_TYPE,
    RESTAURANT_TYPE,
    RESTAURANT_LIST_TYPE,
    PAYMENT_TYPE,
    RESERVATION_MESSAGE_TEMPLATE,
    SLOT_TEMPLATE,
    DEAL_COMMISSION_TYPE,
    DEAL_TEMPLATE,
    RestaurantOperationalFullDay,
    NUKHBA_EMAIL_DOMAIN,
    UserInvitesStatus,
    InviteStatus,
    InfluencerApprovalStatus,
    COMMISSION_TYPE,
    USER_EVENTS_TYPE,
    NUKHBA_POINTS,
    USER_POINTS_TYPE,
    USER_POINTS_MONTHLY_LIMIT,
    USER_CREDIT_STATUS,
    USER_CREDIT_TYPE,
    CASHOUT_APPROVED_STATUS,
    CASHOUT_TYPE,
    WP_MSG_DELIVERED_STATUS,
    POINT_TYPE_DESC,
    PAY_AT_RESTRO_TEXT,
    FEED_TYPE
}

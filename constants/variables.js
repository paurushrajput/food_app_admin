const CUISINES = 'Cuisines';
const LOCATION = 'Location';
const RESTAURANT = 'Restaurants';

const RESTAURANT_SERVE_TYPE = 'Dine In / Take Away';
const MAX_AMENITIES = 6;

const NukhbaDefaultImage = 'https://img.freepik.com/free-photo/fresh-gourmet-meal-beef-taco-salad-plate-generated-by-ai_188544-13382.jpg'; //FIXME: static value is used

const BookingReminderInMins = 60;

const EmailRegex = '[a-z0-9]+@[a-z]+\.[a-z]{2,3}';

const ANDROID_UPDATE = 'android_update';
const IOS_UPDATE = 'ios_update';
const SuperAdminPrefix = "superadmin_"

const NotificationImageType = {
    WITH_IMAGE: '1',
    WITHOUT_IMAGE: '0'
};

const MaxConcurrentLoginLimit = 1000; // users can login from upto 3 device simultaneously

const GUEST_USER_WHITELIST_API = "guest_user_whitelist_api";

const WinnerBreakupType = {
    "REWARD": 1,
    "ASSETS": 2
}

const SYSTEM_USERS = "system_users";
const DEFAULT_DASHBOARD_DATA_INTERVAL_DAYS = 6


const DEFAULT_LOCAL_IP = '127.0.0.1';

const CASHOUT_LOCK_REDIS_KEY = "points_cashout_{{userId}}"
const CONVERT_LOCK_REDIS_KEY = "points_convert_{{userId}}"

const NUKHBA_COIN_UID_BETA = "7bb5976f-912a-11ef-9b03-069d5f43174f"
const NUKHBA_COIN_UID_PROD = "32d196d7-967d-11ef-b564-0a397857f57a"

const USERNAME_CHAR_LENGTH = 6

const hourInSeconds = 3600 

module.exports = {
    CUISINES,
    LOCATION,
    RESTAURANT,
    RESTAURANT_SERVE_TYPE,
    MAX_AMENITIES,
    NukhbaDefaultImage,
    BookingReminderInMins,
    EmailRegex,
    ANDROID_UPDATE,
    IOS_UPDATE,
    SuperAdminPrefix,
    NotificationImageType,
    MaxConcurrentLoginLimit,
    GUEST_USER_WHITELIST_API,
    WinnerBreakupType,
    SYSTEM_USERS,
    DEFAULT_DASHBOARD_DATA_INTERVAL_DAYS,
    DEFAULT_LOCAL_IP,
    CASHOUT_LOCK_REDIS_KEY,
    CONVERT_LOCK_REDIS_KEY,
    NUKHBA_COIN_UID_BETA,
    NUKHBA_COIN_UID_PROD,
    USERNAME_CHAR_LENGTH,
    hourInSeconds
}
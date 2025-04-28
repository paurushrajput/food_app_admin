const NotificationReminder = {
    Title: 'Booking Reminder',
    Message: 'Just a quick reminder: Your booking is scheduled for today at {{datetime}}. We look forward to welcoming you soon!',
    Image: 'https://cdn.nukhba.app/sadmin-app/1714106970202_vv6p0658pgtnq3am_BookingReminder_200x200.png'
}

const BookingFeeRefund = {
    Title: 'Booking Fee Refund',
    Message: 'Your fee has been refunded under special conditions. We look forward to seeing you soon!',
    Image: 'https://cdn.nukhba.app/sadmin-app/1714106880607_kcjuqygdlzwd6c71_MoneyRefund_200x200.png'
}

const NotificationActionType = {
    restaurant: { title: 'Restaurant', value: "nukhbaLink?screen=restaurant", key: "restaurant" },
    game: { title: 'Game Play', value: "nukhbaLink?screen=game", key: "game" },
    shareapp: { title: 'Share App', value: "nukhbaLink?screen=shareapp", key: "shareapp" },
    manual: { title: 'Mannual', value: "nukhbaLink?screen=", key: "manual" }
}

module.exports = {
    NotificationReminder,
    NotificationActionType,
    BookingFeeRefund
}
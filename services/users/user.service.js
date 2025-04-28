const { BookingReminderInMins, NotificationImageType } = require("../../constants/variables");
const ReservationModel = require("../../models/mysql/reservation.model");
const { ReservationTrackStatus, BookingTrackStatus } = require("../../constants/database");
const { getDateOnlyOfTz, getDatetimeOfTz, formatDate } = require("../../utils/moment");
const { India } = require("../../constants/timezone");
const { sendPushNotificationToDevice } = require("../../utils/pushNotification");
const { NotificationReminder } = require("../../constants/notification");
const NotificationMaster = require("../../models/mysql/notificationMaster.model");
const { NOTIFICATION_TEMPLATE_KEYWORD } = require("../../constants/notificationTemplate");
const NotificationTemplateService = require("../admin/notificationTemplate.service");

class UserService {
    static async sendNotificationToUsersForBookingReminder() {
        // const status = ReservationTrackStatus.filter(elem => {
        //     if (elem.key == 'upcoming' || elem.key == 'approved' || elem.key == 'pending') {
        //         return elem.value
        //     }
        // }).map(elem => elem.value);
        const status = [BookingTrackStatus.active, BookingTrackStatus.approved, BookingTrackStatus.pending]
        const datetime = getDatetimeOfTz();
        const date = getDateOnlyOfTz();
        const reservations = await ReservationModel.getBookingReminder(datetime, BookingReminderInMins, date, status);
        const { title, message, image } = await NotificationTemplateService.getNotificationDetailsByKeyword(NOTIFICATION_TEMPLATE_KEYWORD.BOOKING_REMINDER);
        if (reservations && reservations.rows?.length > 0) {
            const notifications = []
            const notificationArr = []
            for (let reservation of reservations.rows) {
                notifications.push(
                    sendPushNotificationToDevice(
                        {
                            title,
                            message: message.replace("{{datetime}}", formatDate(reservation.booking_start, "LT")),
                            fcmToken: reservation.fcm_token,
                            type: NotificationImageType.WITHOUT_IMAGE,
                        }
                    )
                )
                notificationArr.push({
                    title: title,
                    message: message.replace("{{datetime}}", formatDate(reservation.booking_start, "LT")),
                    user_id: reservation.user_id,
                    image_url: image
                })
            }
            NotificationMaster.insert(notificationArr);
            Promise.allSettled(notifications).then(response => {
                console.log("Notification Reminder Success **** ", response)
            }).catch(err => {
                console.log("Notification Reminder Failed **** ", err)
            })
        }
    }
}

module.exports = UserService;
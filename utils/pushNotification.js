const admin = require("firebase-admin");
const { NukhbaDefaultImage, NotificationImageType } = require("../constants/variables");
const axios = require('axios');
const { Logins } = require("../constants/database");
const { isEmptyField } = require("./common");

const config = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
}

admin.initializeApp({
    credential: admin.credential.cert(config),
});

async function sendPushNotification(title, message, fcmToken) {
    const payload = {
        data: {
            title,
            message,
        },
        token: fcmToken,
    };
    try {
        const response = await admin.messaging().send(payload);
        return response;
    } catch (err) {
        console.error(err)
        return err;
    }
}

// async function sendPushNotificationToDevice(title, message, fcmToken, type = NotificationImageType.WITH_IMAGE, image = NukhbaDefaultImage, actionType = null, devices = { android: {}, apns: {}, webpush: {} }) {
//     const payload = {
//         data: {
//             title,
//             message,
//             type,
//             image
//         },
//         ...devices,
//         token: fcmToken
//     };

//     if (type == NotificationImageType.WITHOUT_IMAGE) {
//         delete payload.data.image
//     }

//     if (actionType != null) {
//         payload['data']['actionType'] = actionType;
//     }

//     try {
//         const response = await admin.messaging().send(payload);
//         return response;
//     } catch (err) {
//         console.error(err)
//         return err;
//     }
// }

// async function sendPushNotificationToTopic(title, message, topic, image = NukhbaDefaultImage) {
//     const payload = {
//         data: {
//             title,
//             message,
//             image
//         },
//         topic,
//     };
//     try {
//         const response = await admin.messaging().send(payload);
//         return {
//             success: true,
//             response
//         };
//     } catch (err) {
//         console.error(err)
//         return {
//             success: false,
//             err
//         };;
//     }
// }


async function sendPushNotificationToDevice({ title, message, fcmToken, type = NotificationImageType.WITHOUT_IMAGE, image = '', actionType = null, device = Logins.DeviceType.iOS, data = {} }) {
    let payload = {};

    if (!Array.isArray(fcmToken)) {
        fcmToken = [fcmToken]
    }

    if (device == Logins.DeviceType.iOS) {
        payload = {
            notification: {
                title,
                body: message,
            },
            data: {
                type: String(type),
                image,
                ...data
            },
            tokens: fcmToken
        };
    } else {
        payload = {
            data: {
                title,
                message,
                type: String(type),
                image,
                ...data,
            },
            tokens: fcmToken
        };
    }

    if (type == NotificationImageType.WITHOUT_IMAGE) {
        delete payload.data.image
    }

    if (actionType != null) {
        payload['data']['actionType'] = actionType;
    }

    try {
        // const response = await admin.messaging().send(payload);
        const response = await admin.messaging().sendEachForMulticast(payload);
        return response;
    } catch (err) {
        console.error(err)
        return err;
    }
}


async function sendPushNotificationToTopic({ title, message, topic, data = {}, image = '' }) {
    const notification = {
        title,
        body: message,
        image,
    }

    const fcmKey = process.env.FCM_SERVER_KEY;
    
    if (isEmptyField(fcmKey)) {
        throw new ServerError("FCM_SERVER_KEY is not available in environment");
    }

    try {
        const response = await axios.post('https://fcm.googleapis.com/fcm/send',
            {
                data,
                notification,
                to: `/topics/${topic}`,
            },
            {
                headers: {
                    Authorization:
                        `key=${fcmKey}`,
                },
            },
        )
        return {
            success: true,
            response: response.data
        };
    } catch (err) {
        console.error(err)
        return {
            success: false,
            err
        };
    }
}

module.exports = { sendPushNotification, sendPushNotificationToDevice, sendPushNotificationToTopic }
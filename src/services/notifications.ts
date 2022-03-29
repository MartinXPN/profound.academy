import {db} from "./db";
import {Notification} from "models/notifications";
import firebase from "firebase/compat/app";

export const onNotificationsChanged = (userId: string,
                                       onChanged: (notifications: Notification[]) => void) => {
    return db.notifications(userId)
        .orderBy('createdAt', 'desc')
        .limit(25)
        .onSnapshot(snapshot => {
            const notifications: Notification[] = snapshot.docs.map(x => x.data());
            console.log('notifications:', notifications);
            onChanged(notifications);
        })
};

export const readNotification = async (userId: string, notificationId: string) => {
    return await db.notification(userId, notificationId).set({
        readAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});
}

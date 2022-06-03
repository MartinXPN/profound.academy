import firebase from "firebase/compat";

export interface ScheduledUpdate {
    doc: firebase.firestore.DocumentReference;
    value: {[key: string]: any},
    updateAt: firebase.firestore.Timestamp,
}

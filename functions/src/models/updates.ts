import firebase from 'firebase/compat';

export interface ScheduledUpdate {
    doc: firebase.firestore.DocumentReference;
    updateAt: firebase.firestore.Timestamp,
    key: string;
    diff: number;
}

import firebase from 'firebase/compat/app';

export interface Notification {
    id: string;
    createdAt: firebase.firestore.FieldValue;
    readAt: firebase.firestore.FieldValue | null;
    message: string;
    url: string;
    imageUrl: string;
}

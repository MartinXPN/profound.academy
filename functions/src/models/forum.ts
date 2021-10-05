import firebase from 'firebase';

export interface Comment {
    id: string;
    userId: string;
    displayName: string;
    avatarUrl?: string;
    createdAt: firebase.firestore.FieldValue;

    repliedTo: firebase.firestore.DocumentReference; // Exercise | Comment;
    replies: string[]; // Comment[]
    score: number;
    text: string;
}

export interface Vote {
    vote: number;
}

import firebase from "firebase";
import {Exercise} from "./courses";

export interface Comment {
    id: string;
    userId: string;
    displayName: string;
    avatarUrl: string;
    createdAt: firebase.firestore.FieldValue;

    repliedTo: Exercise | Comment;
    replies: Comment[];
    score: number;
    text: string;
}

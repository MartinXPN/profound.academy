import firebase from "firebase";
import {Exercise} from "./courses";

export interface Comment {
    id: string;
    userId: string;
    displayName: string;
    avatarUrl?: string;
    createdAt: firebase.firestore.Timestamp;

    repliedTo: Exercise | Comment;
    replies: Comment[];
    score: number;
    text: string;
}

export interface Vote {
    vote: number;
}
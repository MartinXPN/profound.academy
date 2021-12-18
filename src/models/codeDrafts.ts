import firebase from "firebase";
import {LANGUAGES} from "./language";

export interface CodeDraft {
    userDisplayName: string;
    code?: { [key: string]: string };
    cursor?: { start: number, end: number };
    language: keyof typeof LANGUAGES;
    updatedAt: firebase.firestore.FieldValue;
}

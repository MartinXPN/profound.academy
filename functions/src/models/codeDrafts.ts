import firebase from 'firebase';
import {LANGUAGES} from './language';


export interface TextSelection {
    start: { row: number, column: number };
    end: { row: number, column: number };
}

export interface CodeDraft {
    id: string;
    userDisplayName: string;
    code?: { [key: string]: string };
    selection?: TextSelection;
    language: keyof typeof LANGUAGES;
    updatedAt: firebase.firestore.FieldValue;
}

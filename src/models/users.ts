import firebase from 'firebase/app';
import {Course} from "./courses";
import {SubmissionStatus} from './submissions';

export interface Progress {
    id: string;
    status: SubmissionStatus;
    updatedAt: firebase.firestore.FieldValue;
}

export interface User {
    courses: Course[];
}

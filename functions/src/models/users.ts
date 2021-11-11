import firebase from 'firebase/app';
import {Course} from './courses';
import {SubmissionStatus} from './submissions';

export interface Progress {
    id: string;
    status: SubmissionStatus;
    updatedAt: firebase.firestore.FieldValue;
}

export interface Activity {
    id: string;
    date: string; // 2021-11-20
    count: number; // how many problems were solved during that day
}

export interface User {
    id: string;
    courses?: Course[];
}

import {Course} from './courses';
import firebase from 'firebase/app';

export interface Activity {
    id: string;
    date: string;                                   // 2021-11-20
    count: number | firebase.firestore.FieldValue;  // how many problems were solved during that day
}

export interface User {
    id: string;
    courses?: Course[];
}

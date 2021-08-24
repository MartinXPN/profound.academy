import firebase from 'firebase/app';
import {Course} from "./courses";

export interface Progress {
    id: string;
    status: 'Solved' | 'Wrong answer' | 'Time limit exceeded' | 'Runtime error' | 'Checking' | 'Unavailable';
    updatedAt: firebase.firestore.FieldValue;
}

export interface User {
    courses: Course[];
}

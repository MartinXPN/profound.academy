import firebase from 'firebase';
import {Exercise} from './exercise';


export interface Course {
    id: string;
    img: string;
    revealsAt: firebase.firestore.Timestamp;
    freezeAt: firebase.firestore.Timestamp;
    visibility: 'public' | 'unlisted' | 'private';
    rankingVisibility: 'public' | 'private';
    allowViewingSolutions: boolean;
    title: string;
    author: string;
    instructors: string[],
    introduction: string; // notion id for the introduction page
    levelExercises: { [key: string]: number };
    levelScores: { [key: string]: number };
    exercises: Exercise[];
}

export interface CoursePrivateFields {
    id: string;
    invitedEmails?: string[];   // list of invited users (emails)
    invitedUsers?: string[];    // list of invited users (ids)
    mailSubject?: string;       // subject of the invitation email
    mailText?: string;          // contents of the invitation email
    sentEmails?: string[];      // list of emails that have already been sent
}


export interface Insight {
    date?: string;
    runs: number;
    solved: number;
    submissions: number;
    totalScore?: number;
    users?: number;
}

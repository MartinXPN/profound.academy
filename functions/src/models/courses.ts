import firebase from 'firebase/compat/app';
import {Exercise} from './exercise';
import { Level } from './levels';


export interface Course {
    id: string;
    img: string;
    revealsAt: firebase.firestore.Timestamp;
    freezeAt: firebase.firestore.Timestamp;
    visibility: 'public' | 'unlisted' | 'private';
    rankingVisibility: 'public' | 'private';    // is the progress of other users visible?
    allowViewingSolutions: boolean;             // allow viewing others' solutions after solving
    author: string;                             // organization/person name
    instructors: string[],                      // userIds

    // TODO: Localize title and introduction
    title: string;
    introduction: string;                       // notion id for the introduction page

    drafts: Level;                              // Exercises that are still in draft phase (not public)
    levels: Level[];
    levelExercises: { [key: string]: number };  // {levelId: numberOfExercisesInLevel}
    levelScores: { [key: string]: number };     // {levelId: scorePerLevel}
    exercises: Exercise[];                      // [sub-collection] all the exercises in the course
}

export interface CoursePrivateFields {
    id: string;                                 // id is fixed to be `fields`
    invitedEmails?: string[];                   // list of invited users (emails)
    invitedUsers?: string[];                    // list of invited users (ids)
    mailSubject?: string;                       // subject of the invitation email
    mailText?: string;                          // contents of the invitation email
    sentEmails?: string[];                      // list of emails that have already been sent
}


export interface Insight {
    date?: string;
    runs: number;
    solved: number;
    submissions: number;
    totalScore?: number;
    users?: number;
}

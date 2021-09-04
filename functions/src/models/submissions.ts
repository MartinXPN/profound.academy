import {Exercise, Course} from './courses';
import firebase from 'firebase/app';
import {LANGUAGES} from './language';

export type SubmissionStatus = 'Solved' |
                                'Wrong answer' |
                                'Time limit exceeded' |
                                'Runtime error' |
                                'Compilation error' |
                                'Checking' |
                                'Unavailable';

export interface Submission {
    id: string;
    userId: string;
    userDisplayName: string;
    exercise: Exercise;
    course: Course;
    submissionFileURL: string;
    language: keyof typeof LANGUAGES; // the language code
    createdAt: firebase.firestore.FieldValue;
    isTestRun: boolean;
}

export interface SubmissionResult extends Submission {
    submissionId: string;
    status: string;
    memory: number;
    time: number;
    score: number;
    outputs?: string;
    compileOutputs?: string;
}

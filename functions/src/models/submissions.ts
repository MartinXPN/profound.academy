import {Exercise, Course, TestCase} from './courses';
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
    testCases?: TestCase[];
    course: Course;
    code?: { [key: string]: string };
    language: keyof typeof LANGUAGES; // the language code
    createdAt: firebase.firestore.FieldValue;
    isTestRun: boolean;
}

export interface SubmissionResult extends Submission {
    isBest: boolean;
    status: string;
    memory: number;
    time: number;
    score: number;
    outputs?: string | string[];
    compileOutputs?: string;
}

export interface SubmissionSensitiveRecords {
    id: string;
    code: { [key: string]: string };
}

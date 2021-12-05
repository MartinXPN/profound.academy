import {Exercise, Course, TestCase} from './courses';
import firebase from 'firebase/app';
import {LANGUAGES} from './language';


export type SubmissionStatus = 'Solved' |                   // OK => 100% score
                                'Wrong answer' |            // WA => partial score or 0
                                'Time limit exceeded' |     // TLE => score 0
                                'Runtime error' |           // RE => partial score or 0
                                'Compilation error' |       // CE => score 0
                                'Checking' |                // In progress...
                                'Unavailable';              // Is not allowed to submit this problem

export interface Submission {
    id: string;
    userId: string;
    userDisplayName: string;
    exercise: Exercise;
    testCases?: TestCase[];
    course: Course;
    code?: { [key: string]: string };
    language: keyof typeof LANGUAGES; // the language code
    createdAt: firebase.firestore.Timestamp;
    isTestRun: boolean;
}

export interface SubmissionResult extends Submission {
    isBest: boolean;
    status: string | string[];
    memory: number | number[];
    time: number | number[];
    score: number;
    outputs?: string | string[];
    compileOutputs?: string;
}

export interface SubmissionSensitiveRecords {
    id: string;
    code: { [key: string]: string };
}

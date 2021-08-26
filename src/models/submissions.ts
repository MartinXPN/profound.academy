import {Exercise} from "./courses";
import firebase from 'firebase/app';

export type SubmissionStatus = 'Solved' |                   // OK => 100% score
                                'Wrong answer' |            // WA => partial score or 0
                                'Time limit exceeded' |     // TLE => score 0
                                'Runtime error' |           // RE => partial score or 0
                                'Compilation error' |       // CE => score 0
                                'Checking' |                // In progress...
                                'Unavailable';              // Is not allowed to submit this problem

export const LANGUAGES = {
    c: 'C',
    cpp: 'C++',
    cpp11: 'C++11',
    cpp14: 'C++14',
    cpp17: 'C++17',
    cpp20: 'C++20',
    python: 'Python',
}

export const LANGUAGE2EXTENSION = {
    c: 'c',
    cpp: 'cpp',
    cpp11: 'cpp',
    cpp14: 'cpp',
    cpp17: 'cpp',
    cpp20: 'cpp',
    python: 'py',
}


export interface Submission {
    id: string;
    userId: string;
    exercise: Exercise;
    submissionFileURL: string;
    language: keyof typeof LANGUAGES;
    createdAt: firebase.firestore.FieldValue;
    isTestRun: boolean;
}

export interface SubmissionResult {
    id: string;
    userId: string;
    exercise: Exercise;
    submissionFileURL: string;
    language: keyof typeof LANGUAGES;
    status: SubmissionStatus;
    score: number;          // [0 - 100]
    memory: number;         // in bytes
    time: number;           // seconds
}

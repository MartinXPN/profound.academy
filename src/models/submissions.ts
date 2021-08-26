import {Exercise} from "./courses";
import firebase from 'firebase/app';
import {Course} from "../../functions/src/models";

export type SubmissionStatus = 'Solved' |                   // OK => 100% score
                                'Wrong answer' |            // WA => partial score or 0
                                'Time limit exceeded' |     // TLE => score 0
                                'Runtime error' |           // RE => partial score or 0
                                'Compilation error' |       // CE => score 0
                                'Checking' |                // In progress...
                                'Unavailable';              // Is not allowed to submit this problem

export const LANGUAGES = {
    'C': 'c',
    'C++': 'cpp11',
    'C++11': 'cpp11',
    'C++14': 'cpp14',
    'C++17': 'cpp17',
    'C++20': 'cpp20',
    'python': 'python',
}

export const LANGUAGE2EXTENSION: {[key: string]: string} = {
    'c': 'c',
    'cpp': 'cpp',
    'cpp11': 'cpp',
    'cpp14': 'cpp',
    'cpp17': 'cpp',
    'cpp20': 'cpp',
    'python': 'py',
}


export interface Submission {
    id: string;
    userId: string;
    exercise: Exercise;
    course: Course;
    submissionFileURL: string;
    language: keyof typeof LANGUAGES;
    createdAt: firebase.firestore.FieldValue;
    isTestRun: boolean;
}

export interface SubmissionResult extends Submission {
    status: string;
    memory: number;
    time: number;
    score: number;
    outputs?: string;
    compileOutputs?: string;
}

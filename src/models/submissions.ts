import {Exercise} from "./courses";

export type SubmissionStatus = 'Solved' | 'Wrong answer' | 'Time limit exceeded' | 'Runtime error' | 'Checking' | 'Unavailable';

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
    c: '.c',
    cpp: '.cpp',
    cpp11: '.cpp',
    cpp14: '.cpp',
    cpp17: '.cpp',
    cpp20: '.cpp',
    python: '.py',
}


export interface Submission {
    id: string;
    userId: string;
    exercise: Exercise;
    submissionFileURL: string;
    language: keyof typeof LANGUAGES;
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

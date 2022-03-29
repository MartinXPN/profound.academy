import {Course} from './courses';
import {Exercise, TestCase} from './exercise';
import firebase from 'firebase/compat/app';
import {LANGUAGES} from './language';

export type SubmissionStatus = 'Solved' |                   // OK => 100% score
                                'Wrong answer' |            // WA => partial score or 0
                                'Time limit exceeded' |     // TLE => score 0
                                'Memory limit exceeded' |   // MLE => score 0
                                'Output limit exceeded' |   // OLE => too much printing
                                'Runtime error' |           // RE => partial score or 0
                                'Compilation error' |       // CE => score 0
                                'Checking' |                // In progress...
                                'Unavailable';              // Is not allowed to submit this problem

export interface Submission {
    id: string;
    userId: string;
    course: Course;
    exercise: Exercise;
    testCases?: TestCase[];
    code?: { [key: string]: string };
    language: keyof typeof LANGUAGES;       // the language code
    createdAt: firebase.firestore.Timestamp;
    isTestRun: boolean;
}

export interface TestResult {
    status: SubmissionStatus;
    memory: number;
    time: number;
    returnCode: number;
    score: number;
    message?: string;
    outputs?: string;
    errors?: string;
}

export interface TestResults {
    testResults: TestResult[];
}

export interface JudgeResult {
    overall: TestResult;
    compileResult?: TestResult;
    testResults?: TestResult[];
}

export interface SubmissionResult extends Submission {
    isBest: boolean;
    status: SubmissionStatus;
    memory: number;
    time: number;
    score: number;
    message?: string;
    outputs?: string;
    errors?: string;
    compileResult?: TestResult;
    // for displaying results
    userDisplayName?: string;
    userImageUrl?: string;
    courseTitle: string;
    exerciseTitle: string | {[key: string]: string};
}

export interface SubmissionSensitiveRecords {
    id: string;
    code: { [key: string]: string };
}

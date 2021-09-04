import {Exercise, Course} from "./courses";
import firebase from 'firebase/app';
import {LANGUAGES} from "./language";
import {TestCase} from "../../functions/src/models/courses";

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
    submissionFileURL: string;
    language: keyof typeof LANGUAGES;       // the language code
    createdAt: firebase.firestore.FieldValue;
    isTestRun: boolean;
}

export interface SubmissionResult extends Submission {
    submissionId: string;
    status: string;
    memory: number;
    time: number;
    score: number;
    outputs?: string | string[];
    compileOutputs?: string;
}

import {Language, LANGUAGES} from './language';
import firebase from 'firebase';
import {SubmissionStatus} from './submissions';


export interface ExerciseType {
    id: string;
    displayName: string;
    description: string;
}

export const EXERCISE_TYPES: { [key: string]: ExerciseType } = {
    testCases: {id: 'testCases', displayName: 'Test cases',
        description: 'An exercise with predefined test cases (input/output or unittest)'},
    code: {id: 'code', displayName: 'Code',
        description: 'An exercise with editable test cases - judge is defined within the platform'},
    textAnswer: {id: 'textAnswer', displayName: 'Text answer',
        description: 'An exercise with a single correct text-based answer (can be a number as well)'},
    checkboxes: {id: 'checkboxes', displayName: 'Checkboxes',
        description: 'An exercise which has several correct answers'},
    multipleChoice: {id: 'multipleChoice', displayName: 'Multiple choice',
        description: 'An exercise with a single correct answer'},
};
export const COMPARISON_MODES = ['whole', 'token', 'custom'] as const;

export interface TestCase {
    input: string;
    target: string;
}

export interface Exercise {
    id: string;
    title: string | {[key: string]: string};        // string or mapping {locale => titleText}
    pageId: string | {[key: string]: string};       // string or mapping {locale => pageId}
    order: number;
    score?: number;
    allowedAttempts?: number;
    exerciseType?: keyof typeof EXERCISE_TYPES;
    unlockContent?: string[],
    allowedLanguages?: (keyof typeof LANGUAGES)[];
    testCases: TestCase[];
    memoryLimit?: number;
    timeLimit?: number;
    outputLimit?: number;
    floatPrecision?: number;
    comparisonMode?: typeof COMPARISON_MODES[number];
    question?: string;
    options?: string[];
}

export interface ExercisePrivateFields {
    id: string;
    answer?: string;
}

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
    details: string;
    introduction: string; // notion id for the introduction page
    levelExercises: { [key: string]: number };
    exercises: Exercise[];
    preferredLanguage: Language;
}


export interface ExerciseProgress<T> {
    id: string;                                 // level
    courseId: string;                           // courseId to be able to query by collectionGroup
    userId: string;                             // userId to be able to query by collectionGroup
    level: string;                              // level again
    progress: { [key: string]: T };             // {exId: score | 'Solved'}
}

export interface Progress {
    id: string;                                             // userId
    userDisplayName: string;                                // how to show the user
    userImageUrl?: string;                                  // Image of the user
    score?: number;                                         // total score for the course
    levelScore?: { [key: string]: number };                 // {level: score}
    exerciseScore?: ExerciseProgress<number>;               // [subcollection] progress = {exId: score}

    solved?: number;                                        // total solved exercises
    levelSolved?: { [key: string]: number };                // {level: #solved}
    exerciseSolved?: ExerciseProgress<SubmissionStatus>;    // [subcollection] progress = {exId: status}
}

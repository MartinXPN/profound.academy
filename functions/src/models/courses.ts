import {Language} from './language';
import firebase from 'firebase';
import {SubmissionStatus} from './submissions';


export interface TestCase {
    input: string;
    target: string;
}

export interface Exercise {
    id: string;
    title: string;
    pageId: string;
    order: number;
    testCases: TestCase[];
    memoryLimit?: number;
    timeLimit?: number;
    floatPrecision?: number;
    comparisonMode?: string;
}

export interface Course {
    id: string;
    img: string;
    revealsAt: firebase.firestore.Timestamp;
    freezeAt: firebase.firestore.Timestamp;
    visibility: string;
    rankingVisibility: string;
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
    score?: number;                                         // total score for the course
    levelScore?: { [key: string]: number };                 // {level: score}
    exerciseScore?: ExerciseProgress<number>;               // [subcollection] progress = {exId: score}

    solved?: number;                                        // total solved exercises
    levelSolved?: { [key: string]: number };                // {level: #solved}
    exerciseSolved?: ExerciseProgress<SubmissionStatus>;    // [subcollection] progress = {exId: status}
}

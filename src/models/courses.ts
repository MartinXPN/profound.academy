import {Language} from "./language";
import firebase from "firebase";
import {SubmissionStatus} from "./submissions";

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
}

export interface Course {
    id: string;
    img: string;
    revealsAt: firebase.firestore.FieldValue;
    freezeAt: firebase.firestore.FieldValue;
    visibility: string;
    rankingVisibility: string;
    title: string;
    author: string;
    instructors: string[],
    details: string;
    introduction: string; // notion id for the introduction page
    exercises: Exercise[];
    preferredLanguage: Language;
}

export interface UserRank {
    id: string;
    userDisplayName: string;
    totalScore: number;
    scores: { [key: string]: number };
}

export interface ExerciseProgress<T> {
    id: string;                                 // level
    courseId: string;                           // courseId to be able to query by collectionGroup
    userId: string;                             // userId to be able to query by collectionGroup
    level: number;                              // level again
    progress: { [key: string]: T };             // {exId: score | 'Solved'}
}

export interface Progress {
    id: string;                                 // userId
    userDisplayName: string;                    // how to show the user
    score: number;                              // total score for the course
    levelScores: { [key: string]: number };     // {level: score}
    exerciseScores: ExerciseProgress<number>;   // progress = {exId: score}

    solved: number;                             // total solved exercises
    levelSolved: { [key: string]: number };     // {level: #solved}
    exerciseSolved: ExerciseProgress<SubmissionStatus>;   // progress = {exId: status}
}

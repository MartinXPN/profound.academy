import {Language} from './language';
import firebase from 'firebase';

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

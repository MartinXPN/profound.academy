import {Language} from './language';

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
    visibility: string;
    title: string;
    author: string;
    instructors: string[],
    details: string;
    introduction: string; // notion id for the introduction page
    exercises: Exercise[];
    preferredLanguage: Language;
}

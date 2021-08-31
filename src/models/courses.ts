import {Language} from "./language";

export interface Exercise {
    id: string;
    title: string;
    pageId: string;
    order: number;
}

export interface Course {
    id: string;
    img: string;
    title: string;
    author: string;
    details: string;
    introduction: string; // notion id for the introduction page
    exercises: Exercise[];
    preferredLanguage: Language;
}

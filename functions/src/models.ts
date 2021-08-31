import firebase from 'firebase';

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
    preferredLanguage: {
        languageCode: string,
        displayName: string,
        extension: string,
    };
}


export interface Submission {
    id: string;
    userId: string;
    exercise: Exercise;
    course: Course;
    submissionFileURL: string;
    language: string;
    createdAt: firebase.firestore.FieldValue;
    isTestRun: boolean;
}

export interface SubmissionResult extends Submission {
    submissionId: string;
    status: string;
    memory: number;
    time: number;
    score: number;
    outputs?: string;
    compileOutputs?: string;
}

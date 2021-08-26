import firebase from 'firebase';

export interface Exercise {
    id: string;
    title: string;
    pageId: string;
    order: number;
}


export interface Submission {
    id: string;
    userId: string;
    exercise: Exercise;
    submissionFileURL: string;
    language: string;
    createdAt: firebase.firestore.FieldValue;
    isTestRun: boolean;
}

export interface SubmissionResult extends Submission {
    status: string;
    memory: number;
    time: number;
    score: number;
    outputs?: string;
    compileOutputs?: string;
}

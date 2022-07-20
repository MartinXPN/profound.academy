import firebase from 'firebase/compat/app';

export interface Comment {
    id: string;
    userId: string;
    displayName: string;
    avatarUrl?: string;
    courseId?: string;
    exerciseId?: string;
    submissionId?: string;
    createdAt: firebase.firestore.Timestamp;

    repliedTo: firebase.firestore.DocumentReference; // Exercise | Comment | SubmissionResult;
    replies: string[]; // Comment[]
    score: number;
    text: string;
}

export interface Vote {
    vote: number;
}

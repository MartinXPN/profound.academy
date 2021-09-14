import firebase from 'firebase/app';
import 'firebase/firestore';
import _ from "lodash";

import {Progress, User} from "../models/users";
import {Course, Exercise} from "../models/courses";
import {Submission, SubmissionResult} from "../models/submissions";
import {Comment} from "../models/forum";

// Add ids when getting the data and removing when sending it
const converter = <T>() => ({
    // @ts-ignore
    toFirestore: (data: T) => _.omit(data, 'id'),
    fromFirestore: (snap: firebase.firestore.QueryDocumentSnapshot) => Object.assign(snap.data(), {id: snap.id}) as unknown as T
});
const dataPoint = <T>(collectionPath: string) => firebase.firestore()
    .collection(collectionPath)
    .withConverter(converter<T>());


const db = {
    transaction: firebase.firestore().runTransaction,

    user: (userId: string) => dataPoint<User>('users').doc(userId),
    progress: (userId: string, courseId: string) => dataPoint<Progress>(`users/${userId}/progress/${courseId}/private`),

    courses: dataPoint<Course>('courses'),
    course: (courseId: string) => dataPoint<Course>('courses').doc(courseId),
    exercises: (courseId: string) => dataPoint<Exercise>(`courses/${courseId}/exercises`),
    exercise: (courseId: string, exerciseId: string) => dataPoint<Exercise>(`courses/${courseId}/exercises`).doc(exerciseId),

    forum: dataPoint<Comment>('forum'),
    forumComment: (commentId: string) => dataPoint<Comment>('forum').doc(commentId),
    submissionQueue: (userId: string) => dataPoint<Submission>(`submissionQueue/${userId}/private`),

    runs: (userId: string) => dataPoint<SubmissionResult>(`runs/${userId}/private`),
    runResult: (userId: string, submissionId: string) => dataPoint<SubmissionResult>(`runs/${userId}/private`).doc(submissionId),

    submissionResults: dataPoint<SubmissionResult>('submissions'),
    submissionResult: (submissionId: string) => dataPoint<SubmissionResult>('submissions').doc(submissionId),
    bestSubmissions: (exerciseId: string) => dataPoint<SubmissionResult>(`bestSubmissions/${exerciseId}/public`),
};

export {db}

import firebase from 'firebase/app';
import 'firebase/firestore';
import _ from "lodash";

import {Progress, User} from "../models/users";
import {Course, Exercise} from "../models/courses";
import {Submission, SubmissionResult, SubmissionSensitiveRecords} from "../models/submissions";
import {Comment, Vote} from "../models/forum";

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
    user: (userId: string) => dataPoint<User>('users').doc(userId),
    userVotes: (commentId: string, userId: string) => dataPoint<Vote>(`users/${userId}/votes`).doc(commentId),
    progress: (userId: string, courseId: string) => dataPoint<Progress>(`users/${userId}/progress/${courseId}/private`),

    courses: dataPoint<Course>('courses'),
    course: (courseId: string) => dataPoint<Course>('courses').doc(courseId),
    exercises: (courseId: string) => dataPoint<Exercise>(`courses/${courseId}/exercises`),
    exercise: (courseId: string, exerciseId: string) => dataPoint<Exercise>(`courses/${courseId}/exercises`).doc(exerciseId),

    forum: dataPoint<Comment>('forum'),
    forumComment: (commentId: string) => dataPoint<Comment>('forum').doc(commentId),
    forumCommentVotes: (commentId: string, userId: string) => dataPoint<Vote>(`forum/${commentId}/voters`).doc(userId),
    submissionQueue: (userId: string) => dataPoint<Submission>(`submissionQueue/${userId}/private`),

    runs: (userId: string) => dataPoint<SubmissionResult>(`runs/${userId}/private`),
    runResult: (userId: string, submissionId: string) => dataPoint<SubmissionResult>(`runs/${userId}/private`).doc(submissionId),

    submissionResults: dataPoint<SubmissionResult>('submissions'),
    submissionResult: (submissionId: string) => dataPoint<SubmissionResult>('submissions').doc(submissionId),
    submissionSensitiveRecords: (userId: string, submissionId: string) => dataPoint<SubmissionSensitiveRecords>(`/submissions/${submissionId}/private`).doc(userId),
    bestSubmissions: (exerciseId: string) => dataPoint<SubmissionResult>(`bestSubmissions/${exerciseId}/public`),
    bestSubmissionSensitiveRecords: (userId: string, exerciseId: string) => dataPoint<SubmissionSensitiveRecords>(`bestSubmissions/${exerciseId}/private`).doc(userId),
};

export {db}

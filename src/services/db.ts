import firebase from 'firebase/app';
import 'firebase/firestore';

import {Activity, Progress, User} from "../models/users";
import {Notification} from "../models/notifications";
import {Course, Exercise, UserRank} from "../models/courses";
import {Submission, SubmissionResult, SubmissionSensitiveRecords} from "../models/submissions";
import {Comment, Vote} from "../models/forum";

// Add ids when getting the data and removing when sending it
const converter = <T>() => ({
    toFirestore: (data: T) => {
        // @ts-ignore
        const {id, ...res} = data;
        return res;
    },
    fromFirestore: (snap: firebase.firestore.QueryDocumentSnapshot) => Object.assign(snap.data(), {id: snap.id}) as unknown as T
});
const dataPoint = <T>(collectionPath: string) => firebase.firestore()
    .collection(collectionPath)
    .withConverter(converter<T>());


const db = {
    user: (userId: string) => dataPoint<User>('users').doc(userId),
    userVotes: (commentId: string, userId: string) => dataPoint<Vote>(`users/${userId}/votes`).doc(commentId),
    progress: (userId: string, courseId: string) => dataPoint<Progress>(`users/${userId}/progress/${courseId}/private`),
    activity: (userId: string) => dataPoint<Activity>(`users/${userId}/activity`),
    notifications: (userId: string) => dataPoint<Notification>(`users/${userId}/notifications/`),
    notification: (userId: string, notificationId: string) => dataPoint<Notification>(`users/${userId}/notifications/`).doc(notificationId),

    courses: dataPoint<Course>('courses'),
    course: (courseId: string) => dataPoint<Course>('courses').doc(courseId),
    exercises: (courseId: string) => dataPoint<Exercise>(`courses/${courseId}/exercises`),
    exercise: (courseId: string, exerciseId: string) => dataPoint<Exercise>(`courses/${courseId}/exercises`).doc(exerciseId),
    ranking: (courseId: string) => dataPoint<UserRank>(`courses/${courseId}/ranking`),

    forum: dataPoint<Comment>('forum'),
    forumComment: (commentId: string) => dataPoint<Comment>('forum').doc(commentId),
    forumCommentVotes: (commentId: string, userId: string) => dataPoint<Vote>(`forum/${commentId}/voters`).doc(userId),
    submissionQueue: (userId: string) => dataPoint<Submission>(`submissionQueue/${userId}/private`),

    runs: (userId: string) => dataPoint<SubmissionResult>(`runs/${userId}/private`),
    run: (userId: string, submissionId: string) => dataPoint<SubmissionResult>(`runs/${userId}/private`).doc(submissionId),

    submissionResults: dataPoint<SubmissionResult>('submissions'),
    submissionResult: (submissionId: string) => dataPoint<SubmissionResult>('submissions').doc(submissionId),
    submissionSensitiveRecords: (userId: string, submissionId: string) => dataPoint<SubmissionSensitiveRecords>(`/submissions/${submissionId}/private`).doc(userId),
};

export {db}

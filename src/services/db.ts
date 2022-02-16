import firebase from 'firebase/app';
import 'firebase/firestore';

import {Activity, User, UserInfoUpdate, UserRole} from "models/users";
import {Notification} from "models/notifications";
import {Course, Exercise, ExercisePrivateFields, ExerciseProgress, Progress} from "models/courses";
import {Submission, SubmissionResult, SubmissionSensitiveRecords, SubmissionStatus} from "models/submissions";
import {Comment, Vote} from "models/forum";
import {CodeDraft} from "models/codeDrafts";
import {Insight} from "models/lib/courses";

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
    users: dataPoint<User>('users'),
    user: (userId: string) => dataPoint<User>('users').doc(userId),
    userRoles: (userId: string) => dataPoint<UserRole>(`users/${userId}/roles`),
    infoUpdates: dataPoint<UserInfoUpdate>('infoUpdates'),
    userInfoUpdate: (userId: string) => dataPoint<UserInfoUpdate>('infoUpdates').doc(userId),
    userVotes: (commentId: string, userId: string) => dataPoint<Vote>(`users/${userId}/votes`).doc(commentId),
    activity: (userId: string) => dataPoint<Activity>(`users/${userId}/activity`),
    notifications: (userId: string) => dataPoint<Notification>(`users/${userId}/notifications/`),
    notification: (userId: string, notificationId: string) => dataPoint<Notification>(`users/${userId}/notifications/`).doc(notificationId),

    courses: dataPoint<Course>('courses'),
    course: (courseId: string) => dataPoint<Course>('courses').doc(courseId),
    courseInsights: (courseId: string) => dataPoint<Insight>(`courses/${courseId}/insights`),
    courseOverallInsights: (courseId: string) => dataPoint<Insight>(`courses/${courseId}/insights`).doc('overall'),
    exercises: (courseId: string) => dataPoint<Exercise>(`courses/${courseId}/exercises`),
    exercise: (courseId: string, exerciseId: string) => dataPoint<Exercise>(`courses/${courseId}/exercises`).doc(exerciseId),
    exercisePrivateFields: (courseId: string, exerciseId: string) => dataPoint<ExercisePrivateFields>(`courses/${courseId}/exercises/${exerciseId}/private`).doc('fields'),
    progress: (courseId: string) => dataPoint<Progress>(`courses/${courseId}/progress`),
    userProgress: (courseId: string, userId: string) => dataPoint<Progress>(`courses/${courseId}/progress`).doc(userId),
    allUserProgress: (userId: string) => firebase.firestore().collectionGroup('progress').withConverter(converter<Progress>()).where('userId', '==', userId),
    courseExerciseProgress: (courseId: string, userId: string, level: string) => dataPoint<ExerciseProgress<SubmissionStatus>>(`courses/${courseId}/progress/${userId}/exerciseSolved`).doc(level),
    levelExerciseProgress: <T>(courseId: string, level: string, metric: string) => firebase.firestore().collectionGroup(metric).withConverter(converter<ExerciseProgress<T>>())
        .where('courseId', '==', courseId).where('level', '==', level),

    forum: dataPoint<Comment>('forum'),
    forumComment: (commentId: string) => dataPoint<Comment>('forum').doc(commentId),
    forumCommentVotes: (commentId: string, userId: string) => dataPoint<Vote>(`forum/${commentId}/voters`).doc(userId),
    submissionQueue: (userId: string) => dataPoint<Submission>(`submissionQueue/${userId}/private`),

    runs: (userId: string) => dataPoint<SubmissionResult>(`runs/${userId}/private`),
    run: (userId: string, submissionId: string) => dataPoint<SubmissionResult>(`runs/${userId}/private`).doc(submissionId),

    submissionResults: dataPoint<SubmissionResult>('submissions'),
    submissionResult: (submissionId: string) => dataPoint<SubmissionResult>('submissions').doc(submissionId),
    submissionSensitiveRecords: (userId: string, submissionId: string) => dataPoint<SubmissionSensitiveRecords>(`/submissions/${submissionId}/private`).doc(userId),

    codeDrafts: (courseId: string, exerciseId: string) => dataPoint<CodeDraft>(`codeDrafts/${courseId}/${exerciseId}`),
    codeDraft: (courseId: string, exerciseId: string, userId: string) => dataPoint<CodeDraft>(`codeDrafts/${courseId}/${exerciseId}`).doc(userId),
};

export {db}

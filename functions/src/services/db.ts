import * as admin from 'firebase-admin';
import {firestore} from 'firebase-admin';

import {CodeDraft} from '../models/codeDrafts';
import {Activity, User, UserInfoUpdate, UserRole} from '../models/users';
import {Notification} from '../models/notifications';
import {Course, CoursePrivateFields, Insight} from '../models/courses';
import {Exercise, ExercisePrivateFields} from '../models/exercise';
import {Progress, ExerciseProgress} from '../models/progress';
import {Submission, SubmissionResult, SubmissionSensitiveRecords, TestResults} from '../models/submissions';
import {Comment, Vote} from '../models/forum';

admin.initializeApp({credential: admin.credential.applicationDefault()});
firestore().settings({ignoreUndefinedProperties: true});

// Add ids when getting the data and removing when sending it
const converter = <T>() => ({
    toFirestore: (data: T) => {
        // @ts-ignore
        const {id, ...res} = data;
        return res;
    },
    // @ts-ignore
    fromFirestore: (snapshot) => Object.assign(snapshot.data(), {id: snapshot.id}) as unknown as T,
});
const dataPoint = <T>(collectionPath: string) => firestore()
    .collection(collectionPath)
    .withConverter(converter<T>());


/* eslint-disable max-len, @typescript-eslint/explicit-module-boundary-types */
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
    coursePrivateFields: (courseId: string) => dataPoint<CoursePrivateFields>(`courses/${courseId}/private`).doc('fields'),
    courseInsights: (courseId: string) => dataPoint<Insight>(`courses/${courseId}/insights`),
    courseOverallInsights: (courseId: string) => dataPoint<Insight>(`courses/${courseId}/insights`).doc('overall'),
    exercises: (courseId: string) => dataPoint<Exercise>(`courses/${courseId}/exercises`),
    exercise: (courseId: string, exerciseId: string) => dataPoint<Exercise>(`courses/${courseId}/exercises`).doc(exerciseId),
    exercisePrivateFields: (courseId: string, exerciseId: string) => dataPoint<ExercisePrivateFields>(`courses/${courseId}/exercises/${exerciseId}/private`).doc('fields'),
    exerciseInsights: (courseId: string, exerciseId: string) => dataPoint<Insight>(`courses/${courseId}/exercises/${exerciseId}/insights`).doc('overall'),
    progress: (courseId: string) => dataPoint<Progress>(`courses/${courseId}/progress`),
    userProgress: (courseId: string, userId: string) => dataPoint<Progress>(`courses/${courseId}/progress`).doc(userId),
    allUserProgress: (userId: string) => firestore().collectionGroup('progress').withConverter(converter<Progress>()).where('userId', '==', userId),
    levelExerciseProgress: <T>(courseId: string, level: string, metric: string) => firestore().collectionGroup(metric).withConverter(converter<ExerciseProgress<T>>())
        .where('courseId', '==', courseId).where('level', '==', level),

    forum: dataPoint<Comment>('forum'),
    forumComment: (commentId: string) => dataPoint<Comment>('forum').doc(commentId),
    forumCommentVotes: (commentId: string, userId: string) => dataPoint<Vote>(`forum/${commentId}/voters`).doc(userId),

    submissionQueue: (userId: string) => dataPoint<Submission>(`submissionQueue/${userId}/private`),
    runs: (userId: string) => dataPoint<SubmissionResult>(`runs/${userId}/private`),
    run: (userId: string, submissionId: string) => dataPoint<SubmissionResult>(`runs/${userId}/private`).doc(submissionId),
    runTestResults: (userId: string, submissionId: string) => dataPoint<TestResults>(`runs/${userId}/private/${submissionId}/testResults`).doc('results'),

    submissionResults: dataPoint<SubmissionResult>('submissions'),
    submissionResult: (submissionId: string) => dataPoint<SubmissionResult>('submissions').doc(submissionId),
    submissionSensitiveRecords: (userId: string, submissionId: string) => dataPoint<SubmissionSensitiveRecords>(`/submissions/${submissionId}/private`).doc(userId),
    submissionTestResults: (userId: string, submissionId: string) => dataPoint<TestResults>(`/submissions/${submissionId}/testResults`).doc(userId),

    codeDraft: (courseId: string, exerciseId: string, userId: string) => dataPoint<CodeDraft>(`codeDrafts/${courseId}/${exerciseId}`).doc(userId),

    mails: dataPoint('mail'),
};
/* eslint-enable max-len, @typescript-eslint/explicit-module-boundary-types */
export {db};

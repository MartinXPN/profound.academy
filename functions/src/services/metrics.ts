import * as functions from 'firebase-functions';
import * as moment from 'moment';
import {firestore} from 'firebase-admin';

import {db} from './db';
import {addCourses} from './users';


export const format = (date: Date) => moment(date).locale('en').format('YYYY-MM-DD');


export const updateUserProgress = (
    transaction: firestore.Transaction,
    metric: string,
    userId: string,
    courseId: string,
    exerciseId: string,
    level: string,
    prev: number,
    cur: number,
    res: number | string,
    force?: boolean,
    rollbackDate?: Date,
) => {
    if (cur < prev && !force)
        return functions.logger.info(`Not updating: ${metric} prev: ${prev}, cur: ${cur}`);

    const uppercaseMetric = metric.charAt(0).toUpperCase() + metric.slice(1);
    functions.logger.info(`Updating metric: ${metric} with prev ${prev} to cur ${cur}`);
    transaction.set(db.userProgress(courseId, userId), {
        userId: userId,
        [metric]: firestore.FieldValue.increment(cur - prev),
        [`level${uppercaseMetric}`]: {[level]: firestore.FieldValue.increment(cur - prev)},
    }, {merge: true});
    transaction.set(db.userProgress(courseId, userId).collection(`exercise${uppercaseMetric}`).doc(level), {
        // workaround to be able to do Collection-Group queries
        'userId': userId,
        'courseId': courseId,
        'level': level,
        'progress': {[exerciseId]: res},
    }, {merge: true});

    if (!rollbackDate)
        return functions.logger.info('No rollback');

    transaction.set(db.updateQueue.doc(), { // @ts-ignore
        doc: db.userProgress(courseId, userId),
        updateAt: firestore.Timestamp.fromDate(rollbackDate),
        value: {
            [metric]: firestore.FieldValue.increment(prev - cur),
            [`level${uppercaseMetric}`]: {[level]: firestore.FieldValue.increment(prev - cur)},
        }
    }, {merge: true});

    transaction.set(db.updateQueue.doc(), { // @ts-ignore
        doc: db.userProgress(courseId, userId).collection(`exercise${uppercaseMetric}`).doc(level),
        updateAt: firestore.Timestamp.fromDate(rollbackDate),
        value: {
            'progress': {[exerciseId]: firestore.FieldValue.increment(prev - cur)},
        }
    }, {merge: true});
};


export const recordInsights = (
    transaction: firestore.Transaction,
    metric: string, courseId: string, exerciseId: string, date: Date,
    value = 1,
) => {
    const insightDay = format(date);
    const record = (location: firestore.DocumentReference) => {
        transaction.set(location, {
            date: insightDay,
            [metric]: firestore.FieldValue.increment(value),
        }, {merge: true});
    };

    record(db.courseInsights(courseId).doc(insightDay));    // Course - day insight
    record(db.courseOverallInsights(courseId));             // Course - overall insight
    record(db.exerciseInsights(courseId, exerciseId));      // Exercise - overall insight
};


export const recordNewUserInsight = async (
    transaction: firestore.Transaction, userId: string, courseId: string, date: Date
) => {
    const insightDay = format(date);
    const user = (await transaction.get(db.user(userId))).data() ?? {id: userId};
    const course = db.course(courseId);
    if (user.courses && user.courses.some((c) => c.id === course.id))
        return functions.logger.info('Not updating new user insight as the user has already signed up for the course');

    await addCourses(transaction, [courseId], user);
    transaction.set(db.courseInsights(courseId).doc(insightDay), {
        users: firestore.FieldValue.increment(1) as unknown as number,
    }, {merge: true});
    transaction.set(db.courseOverallInsights(courseId), {
        users: firestore.FieldValue.increment(1) as unknown as number,
    }, {merge: true});
};

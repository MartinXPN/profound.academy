import {firestore} from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as moment from 'moment';
import {db} from './db';

const format = (date: Date) => moment(date).locale('en').format('YYYY-MM-DD');


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
    const user = (await transaction.get(db.user(userId))).data();
    const course = db.course(courseId);

    if (user && user.courses && user.courses.some((c) => c.id === course.id)) {
        functions.logger.info('Not updating new user insight as the user has already signed up for the course');
        return;
    }

    if (!user || !user.courses || user.courses.length === 0) {
        functions.logger.info('This is the first course of this user!');
        // @ts-ignore
        transaction.set(db.user(userId), {courses: [course]});
    } else {
        functions.logger.info(`The user already has ${user.courses.length} courses. Adding to the list`);
        transaction.set(db.user(userId), {   // @ts-ignore
            courses: firestore.FieldValue.arrayUnion(course),
        }, {merge: true});
    }

    transaction.set(db.courseInsights(courseId).doc(insightDay), {
        users: firestore.FieldValue.increment(1) as unknown as number,
    }, {merge: true});
    transaction.set(db.courseOverallInsights(courseId), {
        users: firestore.FieldValue.increment(1) as unknown as number,
    }, {merge: true});
};

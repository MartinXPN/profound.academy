import {firestore} from 'firebase-admin';
import * as functions from 'firebase-functions';
import {db} from './db';


export const updateUserMetric = (
    transaction: firestore.Transaction,
    metric: string,
    userId: string,
    courseId: string,
    exerciseId: string,
    level: string,
    prev: number,
    cur: number,
    res: number | string,
    force?: boolean
) => {
    if (cur < prev && !force) {
        functions.logger.info(`Not updating: ${metric} prev: ${prev}, cur: ${cur}`);
        return;
    }

    const uppercaseMetric = metric.charAt(0).toUpperCase() + metric.slice(1);
    functions.logger.info(`Updating metric: ${metric} with prev ${prev} to cur ${cur}`);
    transaction.set(db.userProgress(courseId, userId), {
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
};

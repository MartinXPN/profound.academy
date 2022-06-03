import * as functions from 'firebase-functions';
import {firestore} from 'firebase-admin';
import {db} from './db';
import {pathToObject} from './util';


export const updateProgress = async () => {
    const updates = await db.updateQueue.where('updateAt', '<=', firestore.Timestamp.fromDate(new Date())).get();
    return Promise.all(updates.docs.map(async (d) => {
        const update = d.data();
        functions.logger.info(`Updating: ${update.doc.path} - ${update.key} with diff ${update.diff}`);
        return update.doc.set(pathToObject(update.key, firestore.FieldValue.increment(update.diff)), {merge: true});
    }));
};

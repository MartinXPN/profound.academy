import * as functions from 'firebase-functions';
import {firestore} from 'firebase-admin';

import {db} from './db';
import {UserInfoUpdate} from '../models/users';


const updateUserInfo = async (userInfo: UserInfoUpdate): Promise<void> => {
    functions.logger.info(`updating user info: ${JSON.stringify(userInfo)}`);

    // update progress
    const progress = await db.allUserProgress(userInfo.id).get();
    functions.logger.info(`Updating ${progress.docs.length} progress records...`);
    await Promise.all(progress.docs.map((d) => d.ref.set({
        ...(userInfo.displayName && {userDisplayName: userInfo.displayName}),
        ...(userInfo.imageUrl && {userImageUrl: userInfo.imageUrl}),
    }, {merge: true})));

    // update forum comments
    const userComments = await db.forum.where('userId', '==', userInfo.id).get();
    functions.logger.info(`Updating ${userComments.docs.length} comments...`);
    await Promise.all(userComments.docs.map((d) => d.ref.set({
        ...(userInfo.displayName && {displayName: userInfo.displayName}),
        ...(userInfo.imageUrl && {avatarUrl: userInfo.imageUrl}),
    }, {merge: true})));

    // update submissions
    const submissions = await db.submissionResults.where('userId', '==', userInfo.id).get();
    functions.logger.info(`Updating ${submissions.docs.length} submissions...`);
    await Promise.all(submissions.docs.map((d) => d.ref.set({
        ...(userInfo.displayName && {userDisplayName: userInfo.displayName}),
        ...(userInfo.imageUrl && {userImageUrl: userInfo.imageUrl}),
    }, {merge: true})));

    // update user info itself
    functions.logger.info('Updating user info itself...');
    await db.user(userInfo.id).set({
        ...(userInfo.displayName && {displayName: userInfo.displayName}),
        ...(userInfo.imageUrl && {imageUrl: userInfo.imageUrl}),
    }, {merge: true});
};

export const updateInfoQueue = async (): Promise<void> => {
    const updates = (await db.infoUpdates.get()).docs.map((d) => d.data());
    functions.logger.info(`Info updates: ${JSON.stringify(updates)}`);

    await Promise.all(updates.map((u) => updateUserInfo(u)));
    functions.logger.info('Updated user info, now deleting the requests...');
    await Promise.all(updates.map((u) => db.userInfoUpdate(u.id).delete()));
    functions.logger.info('Done');
};

export const addCourses = async (
    transaction: firestore.Transaction,
    userId: string,
    courseIds: string[],
) => {
    const user = (await transaction.get(db.user(userId))).data();
    const completedCourses = user?.completed?.map((c) => c.id) ?? [];
    const courses = courseIds
        .filter((courseId) => !completedCourses.includes(courseId))
        .map((courseId) => db.course(courseId));

    if (courses.length === 0)
        return functions.logger.info('No new courses to add');

    if (!user || !user.courses || user.courses.length === 0) {
        functions.logger.info('This is the first course of this user!');
        // @ts-ignore
        transaction.set(db.user(userId), {courses: courses}, {merge: true});
    } else {
        functions.logger.info(`The user already has ${user.courses.length} courses. Adding to the list`);
        transaction.update(db.user(userId), {courses: firestore.FieldValue.arrayUnion(...courses)});
    }
};

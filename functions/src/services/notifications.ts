import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {Comment} from '../models/forum';
import {Notification} from '../models/notifications';
import {db, firestore} from './db';


const notify = async (notification: Notification, userId: string) => {
    const res = await db.notifications(userId).add(notification);
    functions.logger.info(`added notification for user: ${userId} with id: ${res.id}`);
    return res;
};

export const notifyOnComment = async (comment: Comment): Promise<void> => {
    const user = await admin.auth().getUser(comment.userId);
    const threadUsers: string[] = [];
    let parentComment = await db.forumComment(comment.repliedTo.id).get();
    let repliedTo = comment.repliedTo;

    // Posted under another comment => notify everyone who posted under that comment including the author of the root comment
    while (parentComment.exists) {
        const data = parentComment.data();
        if (!data)
            throw Error(`comment with id: ${parentComment.id} exists but does not have data`);

        functions.logger.info(`parent comment: ${JSON.stringify(data)}`);

        threadUsers.push(data.userId);
        parentComment = await db.forumComment(data.repliedTo.id).get();
        repliedTo = data.repliedTo;
    }

    // get the corresponding exercise and the course
    const exercise = await firestore().doc(repliedTo.path).get();
    const exerciseData = exercise.data();
    if (!exerciseData)
        throw Error(`exercise with id: ${exercise.id} exists but does not have data`);

    functions.logger.info(`exercise: ${JSON.stringify(exerciseData)}`);

    const coursePath = repliedTo.parent.parent?.path;
    if (!coursePath)
        throw Error(`Course with ${coursePath} does not exist`);

    const course = await firestore().doc(coursePath).get();
    const courseData = course.data();
    if (!courseData)
        throw Error(`Course with id: ${course.id} exists but does not have data`);

    functions.logger.info(`course: ${JSON.stringify(courseData)}`);


    // Posted under the exercise:
    //  1. if the person is the instructor => notify all the students
    //  2. if the person is a student => notify the instructors
    if (threadUsers.length === 0) {
        functions.logger.info('The post was made under an exercise');

        if (courseData.instructors.includes(user.uid)) {
            // 1. instructor
            functions.logger.info('The commenter was an instructor');
            const courseStudents = await db.users
                .where('courses', 'array-contains', firestore().doc(coursePath))
                .get();
            threadUsers.push(...courseStudents.docs.map((d) => d.id));
        } else {
            // 2. student
            functions.logger.info('The commenter was a student => notify the instructors');
            threadUsers.push(...courseData.instructors);
        }
    }

    const notification = {
        id: '',
        url: `/${course.id}/${exercise.id}`,
        readAt: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        imageUrl: comment.avatarUrl,
        message: `${user.displayName} commented under ${exerciseData.title}`,
    } as Notification;
    functions.logger.info(`notification: ${JSON.stringify(notification)}`);

    await Promise.all(threadUsers
        .filter((userId) => userId !== comment.userId)
        .map((userId) => notify(notification, userId))
    );
};

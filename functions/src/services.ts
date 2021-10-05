import {NotionAPI} from 'notion-client';
import {ExtendedRecordMap} from 'notion-types';
import {Submission, SubmissionResult} from './models/submissions';
import {Comment} from './models/forum';
import {Notification} from './models/notifications';

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as needle from 'needle';

const app = admin.initializeApp({credential: admin.credential.applicationDefault()});
const AWS_LAMBDA_URL = 'https://l5nhpbb1bd.execute-api.us-east-1.amazonaws.com/Prod/check/';


export const fetchNotionPage = async (pageId: string): Promise<ExtendedRecordMap> => {
    const notion = new NotionAPI();
    return await notion.getPage(pageId);
};

export const submit = async (submission: Submission): Promise<void> => {
    const problem = submission.exercise.id;
    if (!submission.isTestRun && submission.testCases) {
        throw Error('Final submissions cannot have test cases');
    }
    const data = {
        problem: !submission.testCases ? problem : undefined,
        testCases: submission.testCases,
        code: submission.code,
        language: submission.language,
        memoryLimit: 512,
        timeLimit: 2,
        aggregateResults: !submission.isTestRun,
        returnOutputs: submission.isTestRun,
        return_compile_outputs: true,
        comparisonMode: 'token',
    };
    functions.logger.info(`submitting data: ${JSON.stringify(data)}`);
    const res = await needle('post', AWS_LAMBDA_URL, JSON.stringify(data));
    functions.logger.info(`res: ${JSON.stringify(res.body)}`);

    const submissionResult = {
        ...res.body,
        ...submission,
        isBest: false,
    } as SubmissionResult;
    functions.logger.info(`submissionResult: ${JSON.stringify(submissionResult)}`);
    const {id, code, ...submissionRes} = submissionResult;

    if (submission.isTestRun) {
        functions.logger.info(`Updating the run: ${id} with ${JSON.stringify(submissionRes)}`);

        // save the results to /runs/userId/private/<submissionId>
        await app.firestore().collection(`runs/${submission.userId}/private/`).doc(id).set(submissionRes);
        return;
    }

    // Update the best submissions
    const bestUserSubmissionsSnapshot = await app.firestore()
        .collection('submissions')
        .where('isBest', '==', true)
        .where('userId', '==', submission.userId)
        .where('exercise', '==', submission.exercise)
        .get();
    const bestUserSubmissions = bestUserSubmissionsSnapshot.docs.map((s) => s.data());
    if (bestUserSubmissions.length > 1) {
        throw Error(`
        Found duplicate user best submissions: ${submission.userId} for exercise: ${submission.exercise.id}
        `);
    }
    if (bestUserSubmissions.length === 0) {
        functions.logger.info(`
        Best submission for user: ${submission.userId}, exercise ${submission.exercise.id} does not exist
        `);
        submissionRes.isBest = true;
    }
    if (bestUserSubmissions.length === 1) {
        const bestRecord = bestUserSubmissions[0] as SubmissionResult;
        bestRecord.id = bestUserSubmissionsSnapshot.docs[0].id;

        if (bestRecord.score < submissionRes.score ||
            bestRecord.score === submissionRes.score && bestRecord.time > submissionRes.time) {
            functions.logger.info(`Updating the previous best: ${JSON.stringify(bestRecord)}`);

            await app.firestore()
                .collection('submissions')
                .doc(bestRecord.id)
                .set({isBest: false}, {merge: true});
            submissionRes.isBest = true;
            functions.logger.info(`Updated the previous best: ${bestRecord.id}`);
        } else {
            functions.logger.info('Did not update the bestSubmissions list');
        }
    }

    // save the results to /submissions
    await app.firestore().collection('submissions').doc(id).set(submissionRes, {merge: true});
    // save the sensitive information to /submissions/${submissionId}/private/${userId}
    const sensitiveData = {code: code};
    await app.firestore().collection(`submissions/${id}/private`).doc(submission.userId).set(sensitiveData);
    functions.logger.info(`Saved the submission: ${JSON.stringify(code)}`);

    // update user progress
    await app.firestore()
        .collection(`users/${submission.userId}/progress/${submission.course.id}/private/`)
        .doc(submission.exercise.id)
        .set({
            status: submissionResult.status,
            updatedAt: submissionResult.createdAt,
        });
    functions.logger.info('Updated the user progress!');
};


const notify = async (notification: Notification, userId: string) => {
    const {id, ...notificationData} = notification;
    const res = await app.firestore().collection(`users/${userId}/notifications`).add(notificationData);
    functions.logger.info(`added notification for user: ${userId} with id: ${res.id}`);
    return res;
};

export const notifyOnComment = async (comment: Comment): Promise<void> => {
    const db = app.firestore();
    const user = await admin.auth().getUser(comment.userId);
    const threadUsers: string[] = [];
    let parentComment = await db.doc(`forum/${comment.repliedTo.id}`).get();
    let repliedTo = comment.repliedTo;

    // Posted under another comment => notify everyone who posted under that comment including the author of the root comment
    while (parentComment.exists) {
        const data = parentComment.data();
        if (!data) {
            throw Error(`comment with id: ${parentComment.id} exists but does not have data`);
        }
        functions.logger.info(`parent comment: ${JSON.stringify(data)}`);

        threadUsers.push(data.userId);
        parentComment = await db.doc(`forum/${data.repliedTo.id}`).get();
        repliedTo = data.repliedTo;
    }

    // get the corresponding exercise and the course
    const exercise = await db.doc(repliedTo.path).get();
    const exerciseData = exercise.data();
    if (!exerciseData) {
        throw Error(`exercise with id: ${exercise.id} exists but does not have data`);
    }
    functions.logger.info(`exercise: ${JSON.stringify(exerciseData)}`);

    const coursePath = repliedTo.parent.parent?.path;
    if (!coursePath) {
        throw Error(`Course with ${coursePath} does not exist`);
    }
    const course = await db.doc(coursePath).get();
    const courseData = course.data();
    if (!courseData) {
        throw Error(`Course with id: ${course.id} exists but does not have data`);
    }
    functions.logger.info(`course: ${JSON.stringify(courseData)}`);


    // Posted under the exercise:
    //  1. if the person is the instructor => notify all the students
    //  2. if the person is a student => notify the instructors
    if (threadUsers.length === 0) {
        functions.logger.info('The post was made under an exercise');

        if (courseData.instructors.includes(user.uid)) {
            // 1. instructor
            functions.logger.info('The commenter was an instructor');
            const courseStudents = await db.collection('users')
                .where('courses', 'array-contains', db.doc(coursePath))
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

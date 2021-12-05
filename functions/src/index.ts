import * as functions from 'firebase-functions';
import {fetchNotionPage} from './services/notion';
import {notifyOnComment} from './services/notifications';
import {submit} from './services/submissions';

import {Submission} from './models/submissions';
import {Comment} from './models/forum';

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = functions.https
    .onRequest((request, response) => {
        functions.logger.info('Hello logs!');
        response.send('Hello from Firebase!');
    });

export const getNotionPage = functions.https
    .onCall(async (data, context) => {
        functions.logger.info(`data: ${JSON.stringify(data)}`);
        const pageId = data.pageId;
        if (!pageId)
            throw new functions.https.HttpsError(
                'invalid-argument',
                'pageId needs to be provided in data'
            );

        const recordMap = await fetchNotionPage(pageId);
        functions.logger.info(`recordMap: ${JSON.stringify(recordMap)}`);
        return recordMap;
    });


export const submitSolution = functions.firestore
    .document('submissionQueue/{userId}/private/{submissionId}')
    .onWrite(async (snapshot, context) => {
        const userId = context.params.userId;
        const submissionId = context.params.submissionId;

        const submission = {
            id: submissionId,
            ...snapshot.after.data(),
        } as Submission;

        functions.logger.info(`submission created for user: ${userId} with submissionId: ${submissionId}`);
        functions.logger.info(`process submission: ${JSON.stringify(submission)}`);
        await submit(submission);
    });

export const notifyComment = functions.firestore
    .document('forum/{commentId}')
    .onCreate(async (snapshot, context) => {
        const commentId = context.params.commentId;
        const comment = {
            id: commentId,
            ...snapshot.data(),
        } as Comment;

        functions.logger.info(`comment: ${JSON.stringify(comment)}`);
        await notifyOnComment(comment);
    });

import * as cors from 'cors';
import * as functions from 'firebase-functions';
import {fetchNotionPage} from './services/notion';
import {notifyOnComment} from './services/notifications';
import {submit} from './services/submissions';

import {Submission} from './models/submissions';
import {Comment} from './models/forum';

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

const corss = cors({origin: true});

export const helloWorld = functions.https
    .onRequest((req, res) => {
        functions.logger.info('Hello logs!');
        res.send('Hello from Firebase!');
    });

export const getNotionPage = functions.https.onRequest(async (req, res) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.method !== 'GET') {
        res.status(403).send('Forbidden');
        return;
    }

    corss(req, res, async () => {
        functions.logger.info(`query: ${JSON.stringify(req.query)}`);
        const pageId = req.query.pageId;

        if (!pageId) {
            res.status(400).send('pageId needs to be provided in data');
            return;
        }

        const recordMap = await fetchNotionPage(<string>pageId);
        functions.logger.info(`recordMap #chars: ${JSON.stringify(recordMap).length}`);
        res.status(200).send(recordMap);
    });
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

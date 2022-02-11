import * as cors from 'cors';
import * as functions from 'firebase-functions';
import * as express from 'express';
import {fetchNotionPage} from './services/notion';
import {notifyOnComment} from './services/notifications';

import {Submission} from './models/submissions';
import {Comment} from './models/forum';
import {updateInfoQueue} from './services/users';
import {getS3UploadSignedUrl, isCourseInstructor} from './services/courses';
import {submit} from './services/submissions';
import {processResult} from './services/submissionResults';


const corss = cors({origin: true});

export const helloWorld = functions.https.onRequest((req, res) => {
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

export const getS3UploadUrl = functions.https.onCall(async (data, context) => {
    if (!await isCourseInstructor(data.courseId, context.auth?.uid))
        throw Error(`User ${context.auth?.uid} tried to modify tests of ${data.courseId} course`);

    functions.logger.info(`getS3UploadUrl: ${JSON.stringify(data)}`);
    const url = getS3UploadSignedUrl(data.exerciseId, data.contentType);
    functions.logger.info(`got URL: ${url}`);
    return url;
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

const app = express();
app.post('/:userId/:submissionId', async (req, res) => {
    functions.logger.info(`processSubmissionResult!: ${JSON.stringify(req.body)}`);
    await processResult(req.body, req.params.userId, req.params.submissionId);
    res.send('Successfully updated contestant results');
});
export const processSubmissionResult = functions.https.onRequest(app);

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

export const scheduledUserInfoUpdate = functions.pubsub
    .schedule('every 10 minutes')
    .onRun(updateInfoQueue);

import * as functions from 'firebase-functions';
import * as express from 'express';

import {Submission} from './models/submissions';
import {Comment} from './models/forum';


export const helloWorld = functions.https.onRequest((req, res) => {
    functions.logger.info('Hello logs!');
    res.send('Hello from Firebase!');
});

export const getNotionPage = functions.https.onRequest(async (req, res) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=300');      // cache for 5 minutes
    if (req.method !== 'GET') {
        res.status(403).send('Forbidden');
        return;
    }

    const {fetchNotionPage, getCachedPage, cacheNotionPage} = await import('./services/notion');
    const corsLib = await import('cors');
    const cors = corsLib({origin: true});
    cors(req, res, async () => {
        functions.logger.info(`query: ${JSON.stringify(req.query)}`);
        const pageId = req.query.pageId as string;

        if (!pageId) {
            res.status(400).send('pageId needs to be provided in data');
            return;
        }

        let sent = false;
        const cachedPage = await getCachedPage(pageId);
        if (cachedPage) {
            functions.logger.info('Sending results using cache');
            res.status(200).send(cachedPage);
            sent = true;
        }

        const recordMap = await fetchNotionPage(pageId);
        await cacheNotionPage(pageId, recordMap);
        functions.logger.info(`recordMap #chars: ${JSON.stringify(recordMap).length}`);

        if (!sent)
            res.status(200).send(recordMap);
    });
});

export const sendCourseInviteEmails = functions.https.onCall(async (data, context) => {
    const {isCourseInstructor, sendInviteEmails} = await import('./services/courses');
    if (!await isCourseInstructor(data.courseId, context.auth?.uid))
        throw Error(`User ${context.auth?.uid} tried to send invites for ${data.courseId} course`);

    functions.logger.info(`sendInviteEmails: ${JSON.stringify(data)}`);
    return await sendInviteEmails(data.courseId);
});

export const reEvaluateSubmissions = functions.https.onCall(async (data, context) => {
    const {isCourseInstructor} = await import('./services/courses');
    const {resubmitSolutions} = await import('./services/resubmit');
    if (!await isCourseInstructor(data.courseId, context.auth?.uid))
        throw Error(`User ${context.auth?.uid} tried to reEvaluate submissions: ${data.courseId} ${data.exerciseId}`);

    functions.logger.info(`reEvaluateSubmissions: ${JSON.stringify(data)}`);
    return await resubmitSolutions(data.courseId, data.exerciseId);
});

export const getS3UploadUrl = functions.https.onCall(async (data, context) => {
    const {getS3UploadSignedUrl, isCourseInstructor} = await import('./services/courses');
    if (!await isCourseInstructor(data.courseId, context.auth?.uid))
        throw Error(`User ${context.auth?.uid} tried to modify tests of ${data.courseId} course`);

    functions.logger.info(`getS3UploadUrl: ${JSON.stringify(data)}`);
    const url = getS3UploadSignedUrl(data.exerciseId, data.contentType);
    functions.logger.info(`got URL: ${url}`);
    return url;
});

export const getPrivateTestsSummary = functions.https.onCall(async (data, context) => {
    const {isCourseInstructor} = await import('./services/courses');
    const {getPrivateTestsSummary} = await import('./services/exercises');
    if (!await isCourseInstructor(data.courseId, context.auth?.uid))
        throw Error(`User ${context.auth?.uid} tried to access private tests of ${data.courseId}/${data.exerciseId}`);

    functions.logger.info(`getPrivateTestsSummary: ${JSON.stringify(data)}`);
    const tests = await getPrivateTestsSummary(data.exerciseId);
    functions.logger.info(`got tests: ${JSON.stringify(tests)}`);
    return tests;
});

export const submitSolution = functions.firestore
    .document('submissionQueue/{userId}/private/{submissionId}')
    .onWrite(async (snapshot, context) => {
        const {submit} = await import('./services/submissions');
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
    const {processResult} = await import('./services/submissionResults');
    functions.logger.info(`processSubmissionResult!: ${JSON.stringify(req.body)}`);
    await processResult(req.body, req.params.userId, req.params.submissionId);
    res.send('Successfully updated contestant results');
});
export const processSubmissionResult = functions.https.onRequest(app);

export const notifyComment = functions.firestore
    .document('forum/{commentId}')
    .onCreate(async (snapshot, context) => {
        const {notifyOnComment} = await import('./services/notifications');

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
    .onRun(async () => {
        const {updateInfoQueue} = await import('./services/users');
        return updateInfoQueue();
    });


export const scheduledProgressUpdate = functions.pubsub
    .schedule('every hour')
    .onRun(async () => {
        const {updateProgress} = await import('./services/updates');
        return updateProgress();
    });

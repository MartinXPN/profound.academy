import * as functions from 'firebase-functions';
import {fetchNotionPage, submit, textFromStorageUrl} from './services';
import {Submission} from './models/submissions';

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
        if (!pageId) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'pageId needs to be provided in data'
            );
        }
        const recordMap = await fetchNotionPage(pageId);
        functions.logger.info(`recordMap: ${JSON.stringify(recordMap)}`);
        return recordMap;
    });

export const getCodeFromUrl = functions.https
    .onCall(async (data, context) => {
        functions.logger.info(`data: ${JSON.stringify(data)}`);
        return await textFromStorageUrl(data.url);
    });


export const submitSolution = functions.firestore
    .document('submissionQueue/{userId}/private/{submissionId}')
    .onWrite(async (snapshot, context) => {
        const userId = context.params.userId;
        const submissionId = context.params.submissionId;

        const submission = {
            id: snapshot.after.id,
            ...snapshot.after.data(),
        } as Submission;

        functions.logger.info(`submission created for user: ${userId} with submissionId: ${submissionId}`);
        functions.logger.info(`process submission: ${JSON.stringify(submission)}`);
        await submit(submission);
    });

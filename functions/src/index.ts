import * as functions from 'firebase-functions';
import {fetchNotionPage} from './services';

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info('Hello logs!');
    response.send('Hello from Firebase!');
});

exports.getNotionPage = functions.https.onCall(async (data, context) => {
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

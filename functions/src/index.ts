import * as functions from 'firebase-functions';
import * as cors from 'cors';
import * as express from 'express';
import {fetchNotionPage} from './services';


const app = express();
const corsHandler = cors({origin: true});


// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info('Hello logs!');
    response.send('Hello from Firebase!');
});


app.get('/:id', async (req, res) => {
    const pageId = req.params.id;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    corsHandler(req, res, () => {});
    res.send(await fetchNotionPage(pageId));
});

exports.notionPage = functions.https.onRequest(app);

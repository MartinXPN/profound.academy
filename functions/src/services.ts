import {NotionAPI} from 'notion-client';
import {ExtendedRecordMap} from 'notion-types';
import {Submission, SubmissionResult} from './models';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as needle from 'needle';

const app = admin.initializeApp({credential: admin.credential.applicationDefault()});

export const fetchNotionPage = async (pageId: string): Promise<ExtendedRecordMap> => {
    const notion = new NotionAPI();
    return await notion.getPage(pageId);
};


export const submit = async (submission: Submission): Promise<void> => {
    const AWS_LAMBDA_URL = 'https://jz7y9k248f.execute-api.us-east-1.amazonaws.com/Prod/check/';
    functions.logger.info(`Firebase admin app: ${app.name}`);

    const data = {
        problem: submission.exercise.id,
        submissionDownloadUrl: submission.submissionFileURL,
        language: submission.language,
        memoryLimit: 512,
        timeLimit: 5,
        returnOutputs: submission.isTestRun,
        return_compile_outputs: true,
        stopOnFirstFail: !submission.isTestRun,
    };
    const res = await needle('post', AWS_LAMBDA_URL, JSON.stringify(data));
    functions.logger.info(`res: ${JSON.stringify(res.body)}`);
    functions.logger.info(`exerciseId: ${submission.exercise.id}`);

    const submissionResult = {
        ...res.body,
        ...submission,
    } as SubmissionResult;
    functions.logger.info(`submissionResult: ${JSON.stringify(submissionResult)}`);

    // save the results to /submissions
    const submissions = app.firestore().collection('submissions');
    const {id, ...submissionRes} = submissionResult;
    await submissions.doc(id).set(submissionRes);

    // save the results to /bestSubmissions
    const bestUserSubmission = app.firestore()
        .collection('bestSubmissions')
        .doc(submission.exercise.id)
        .collection('public')
        .doc(submission.userId);
    const bestContent = await bestUserSubmission.get();
    if (bestContent.exists && bestContent.data()?.score >= submissionRes.score) {
        functions.logger.info('Did not update the bestSubmissions list');
        return;
    }
    await bestUserSubmission.set(submissionResult);
    functions.logger.info('Updated the bestSubmissions list!');
};

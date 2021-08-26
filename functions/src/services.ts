import {NotionAPI} from 'notion-client';
import {ExtendedRecordMap} from 'notion-types';
import {Submission, SubmissionResult} from './models';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as needle from 'needle';

export const fetchNotionPage = async (pageId: string): Promise<ExtendedRecordMap> => {
    const notion = new NotionAPI();
    return await notion.getPage(pageId);
};


export const submit = async (submission: Submission): Promise<void> => {
    const AWS_LAMBDA_URL = 'https://jz7y9k248f.execute-api.us-east-1.amazonaws.com/Prod/check/';
    const app = admin.initializeApp({credential: admin.credential.applicationDefault()});
    functions.logger.info(`Firebase admin app: ${app.name}`);

    // TODO:
    //  1. Send the submission stored in submission.submissionFileURL to AWS Lambda to check against submission.exercise.id tests
    //  2. Store the result in /submissions /bestSubmissions
    const data = {
        problem: 'A.zip',
        submission: '000017-A.cpp',
        language: submission.language,
        memoryLimit: 512,
        timeLimit: 5,
        returnOutputs: submission.isTestRun,
        return_compile_outputs: true,
        stopOnFirstFail: !submission.isTestRun,
    };
    const res = await needle('post', AWS_LAMBDA_URL, JSON.stringify(data));
    functions.logger.info(`res: ${JSON.stringify(res.body)}`);

    const submissionResult = {
        ...res.body,
        ...submission,
    } as SubmissionResult;
    functions.logger.info(`submissionResult: ${JSON.stringify(submissionResult)}`);

    const submissions = app.firestore().collection('submissions');
    const {id, ...submissionRes} = submissionResult;
    await submissions.doc(id).set(submissionRes);
};

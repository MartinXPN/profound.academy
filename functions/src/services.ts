import {NotionAPI} from 'notion-client';
import {ExtendedRecordMap} from 'notion-types';
import {Submission, SubmissionResult} from './models/submissions';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as needle from 'needle';

const app = admin.initializeApp({credential: admin.credential.applicationDefault()});
const AWS_LAMBDA_URL = 'https://8f8okoin8a.execute-api.us-east-1.amazonaws.com/Prod/check/';


export const fetchNotionPage = async (pageId: string): Promise<ExtendedRecordMap> => {
    const notion = new NotionAPI();
    return await notion.getPage(pageId);
};


export const submit = async (submission: Submission): Promise<void> => {
    const problem = submission.exercise.id + (submission.isTestRun ? '-public' : '-private');
    if (!submission.isTestRun && submission.testCases) {
        throw Error('Final submissions cannot have test cases');
    }
    const data = {
        problem: !submission.testCases ? problem : undefined,
        testCases: submission.testCases,
        submissionDownloadUrl: submission.submissionFileURL,
        language: submission.language,
        memoryLimit: 512,
        timeLimit: 2,
        returnOutputs: submission.isTestRun,
        return_compile_outputs: true,
        stopOnFirstFail: !submission.isTestRun,
        comparisonMode: 'token',
    };
    functions.logger.info(`submitting data: ${JSON.stringify(data)}`);
    const res = await needle('post', AWS_LAMBDA_URL, JSON.stringify(data));
    functions.logger.info(`res: ${JSON.stringify(res.body)}`);

    const submissionResult = {
        ...res.body,
        ...submission,
    } as SubmissionResult;
    submissionResult.submissionId = submission.id;
    functions.logger.info(`submissionResult: ${JSON.stringify(submissionResult)}`);
    const {id, ...submissionRes} = submissionResult;

    if (submission.isTestRun) {
        functions.logger.info(`Updating the run: ${id} with ${JSON.stringify(submissionRes)}`);

        // save the results to /runs/userId/private/<submissionId>
        await app.firestore().collection(`runs/${submission.userId}/private/`).doc(id).set(submissionRes);
        return;
    }

    // save the results to /submissions
    const submissions = app.firestore().collection('submissions');
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

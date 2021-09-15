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

export const textFromStorageUrl = async (url: string): Promise<string> => {
    const response = await needle('get', url);
    return response.raw.toString();
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
    const {id, submissionFileURL, ...submissionRes} = submissionResult;

    if (submission.isTestRun) {
        functions.logger.info(`Updating the run: ${id} with ${JSON.stringify(submissionRes)}`);

        // save the results to /runs/userId/private/<submissionId>
        await app.firestore().collection(`runs/${submission.userId}/private/`).doc(id).set(submissionRes);
        return;
    }

    // save the results to /submissions
    const submissions = app.firestore().collection('submissions');
    await submissions.doc(id).set(submissionRes);
    // save the sensitive information to /submissions/${submissionId}/private/${userId}
    const sensitiveData = {submissionFileURL: submissionFileURL};
    await app.firestore().collection(`submissions/${id}/private`).doc(submission.userId).set(sensitiveData);
    functions.logger.info(`Saved the submission file url: ${submissionFileURL}`);


    // save the results to /bestSubmissions
    const bestUserSubmission = app.firestore()
        .collection(`bestSubmissions/${submission.exercise.id}/public`)
        .doc(submission.userId);
    const bestContent = await bestUserSubmission.get();
    if (bestContent.exists) {
        const bestRecord = bestContent.data() as SubmissionResult;
        if (bestRecord.score > submissionRes.score ||
            bestRecord.score === submissionRes.score && bestRecord.time < submissionRes.time) {
            functions.logger.info('Did not update the bestSubmissions list');
            return;
        }
    }

    await bestUserSubmission.set(submissionRes);
    functions.logger.info('Updated the bestSubmissions list!');
    // save the sensitive information to /bestSubmissions/${exerciseId}/public/${userId}/private/data
    await app.firestore()
        .collection(`bestSubmissions/${submission.exercise.id}/private`)
        .doc(submission.userId).set(sensitiveData);
    functions.logger.info('Saved the submission file url to private/data');

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

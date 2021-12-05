import {firestore} from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as needle from 'needle';
import * as moment from 'moment';

import {db} from './db';
import {Submission, SubmissionResult} from '../models/submissions';

const AWS_LAMBDA_URL = 'https://l5nhpbb1bd.execute-api.us-east-1.amazonaws.com/Prod/check/';


const updateBest = (
    transaction: firestore.Transaction,
    submission: SubmissionResult,
    bestSubmission?: SubmissionResult,
) => {
    functions.logger.info('Updating the best submissions...');
    if (!bestSubmission) {
        submission.isBest = true;
        functions.logger.info('No best submissions before this => setting to best');
    } else if (bestSubmission.score < submission.score ||
        bestSubmission.score === submission.score && bestSubmission.time > submission.time) {
        functions.logger.info(`Updating the previous best: ${JSON.stringify(bestSubmission)}`);

        transaction.set(db.submissionResult(bestSubmission.id), {isBest: false}, {merge: true});
        submission.isBest = true;
        functions.logger.info(`Updated the previous best: ${bestSubmission.id}`);
    } else {
        functions.logger.info('Did not update the bestSubmissions list');
    }

    // // save the results to /submissions
    transaction.set(db.submissionResult(submission.id), submission);
};

const updateActivity = (
    transaction: firestore.Transaction,
    submission: SubmissionResult,
) => {
    // update user activity
    if (submission.status === 'Solved') {
        functions.logger.info('Updating the user activity...');

        const submissionDate = submission.createdAt.toDate();
        const submissionDay = moment(submissionDate).format('YYYY-MM-DD');

        transaction.set(db.activity(submission.userId).doc(submissionDay), {
            count: firestore.FieldValue.increment(1),
            date: submissionDay,
        }, {merge: true});
        functions.logger.info('Updated the user activity!');
    }
};


export const processSubmissionResult = async (
    submissionResult: SubmissionResult,
    isTestRun: boolean,
    userId: string
): Promise<void> => {
    const {code, ...submissionRes} = submissionResult;

    if (isTestRun) {
        functions.logger.info(`Updating the run: ${submissionResult.id} with ${JSON.stringify(submissionRes)}`);

        // save the results to /runs/userId/private/<submissionId>
        await db.run(userId, submissionResult.id).set(submissionRes);
        return;
    }
    functions.logger.info(`Updating the submission: ${submissionResult.id} with ${JSON.stringify(submissionResult)}`);

    await firestore().runTransaction(async (transaction) => {
        // Update the best submissions
        const bestUserSubmissionsRef = db.submissionResults
            .where('isBest', '==', true)
            .where('userId', '==', submissionResult.userId)
            .where('exercise', '==', submissionResult.exercise);

        const bestUserSubmissions = (await transaction.get(bestUserSubmissionsRef)).docs.map((s) => s.data());
        let alreadySolved = false;

        if (bestUserSubmissions.length > 1) {
            throw Error(`Duplicate user best: ${submissionRes.userId} for exercise: ${submissionRes.exercise.id}`);
        }
        const currentBest = bestUserSubmissions.length === 1 ? bestUserSubmissions[0] : undefined;
        if (currentBest?.status === 'Solved') {
            alreadySolved = true;
        }
        console.log(`Already solved (${submissionResult.id}): ${alreadySolved}`);
        updateBest(transaction, submissionRes, currentBest);

        // save the sensitive information to /submissions/${submissionId}/private/${userId}
        const sensitiveData = {code: code};
        transaction.set(db.submissionSensitiveRecords(submissionResult.userId, submissionResult.id), sensitiveData);
        functions.logger.info(`Saved the submission: ${JSON.stringify(code)}`);

        if (!alreadySolved) {
            updateActivity(transaction, submissionRes);
        }
    });

    // // update user progress
    // const progress = {
    //     status: submissionResult.status,
    //     updatedAt: submissionResult.createdAt,
    // } as Progress;
    // await app.firestore()
    //     .collection(`users/${submission.userId}/progress/${submission.course.id}/private/`)
    //     .doc(submission.exercise.id)
    //     .set(progress);
    // functions.logger.info('Updated the user progress!');
    //
    // // update ranking
    // let exercisePrevScore = 0;
    // const userRankingRef = app.firestore()
    //     .collection(`courses/${submission.course.id}/ranking`)
    //     .doc(submission.userId);
    // const userRanking = await userRankingRef.get();
    // if (!submission.isTestRun && userRanking.exists) {
    //     const userRankingData = userRanking.data();
    //     if (userRankingData && submissionRes.exercise.id in userRankingData.scores) {
    //         exercisePrevScore = userRankingData.scores[submissionRes.exercise.id];
    //     }
    // }
    //
    // const course = await app.firestore().collection('courses').doc(submission.course.id).get();
    // const courseData = course.data() as Course;
    // // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // // @ts-ignore
    // if (exercisePrevScore <= submissionRes.score && courseData && courseData.freezeAt.toDate() > Date.now()) {
    //     await userRankingRef.set({
    //         userDisplayName: (await app.auth().getUser(submissionRes.userId)).displayName,
    //         totalScore: admin.firestore.FieldValue.increment(submissionRes.score - exercisePrevScore),
    //         scores: {
    //             [submission.exercise.id]: submissionRes.score,
    //         },
    //     }, {merge: true});
    //     console.log('Updated ranking!');
    // }
};


export const submit = async (submission: Submission): Promise<void> => {
    const problem = submission.exercise.id;
    if (!submission.isTestRun && submission.testCases) {
        throw Error('Final submissions cannot have test cases');
    }
    const exercise = (await db.exercise(submission.course.id, submission.exercise.id).get()).data();
    functions.logger.info(`submission exercise: ${JSON.stringify(exercise)}`);
    const data = {
        problem: !submission.testCases ? problem : undefined,
        testCases: submission.testCases,
        code: submission.code,
        language: submission.language,
        memoryLimit: exercise?.memoryLimit ?? 512,
        timeLimit: exercise?.timeLimit ?? 2,
        floatPrecision: exercise?.floatPrecision ?? 0.001,
        aggregateResults: !submission.isTestRun,
        returnOutputs: submission.isTestRun,
        returnCompileOutputs: true,
        comparisonMode: exercise?.comparisonMode ?? 'token',
    };
    functions.logger.info(`submitting data: ${JSON.stringify(data)}`);
    const res = await needle('post', AWS_LAMBDA_URL, JSON.stringify(data));
    functions.logger.info(`res: ${JSON.stringify(res.body)}`);

    const submissionResult = {
        ...res.body,
        ...submission,
        isBest: false,
    } as SubmissionResult;
    functions.logger.info(`submissionResult: ${JSON.stringify(submissionResult)}`);

    await processSubmissionResult(submissionResult, submission.isTestRun, submission.userId);
};


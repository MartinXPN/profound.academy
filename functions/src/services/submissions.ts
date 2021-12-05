import {Submission, SubmissionResult} from '../models/submissions';

import * as functions from 'firebase-functions';
import * as needle from 'needle';
import {db} from './db';

const AWS_LAMBDA_URL = 'https://l5nhpbb1bd.execute-api.us-east-1.amazonaws.com/Prod/check/';


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
    // const {id, code, ...submissionRes} = submissionResult;
    //
    // if (submission.isTestRun) {
    //     functions.logger.info(`Updating the run: ${id} with ${JSON.stringify(submissionRes)}`);
    //
    //     // save the results to /runs/userId/private/<submissionId>
    //     await app.firestore().collection(`runs/${submission.userId}/private/`).doc(id).set(submissionRes);
    //     return;
    // }
    //
    // // Update the best submissions
    // const bestUserSubmissionsSnapshot = await app.firestore()
    //     .collection('submissions')
    //     .where('isBest', '==', true)
    //     .where('userId', '==', submission.userId)
    //     .where('exercise', '==', submission.exercise)
    //     .get();
    // const bestUserSubmissions = bestUserSubmissionsSnapshot.docs.map((s) => s.data());
    // let alreadySolved = false;
    // if (bestUserSubmissions.length > 1) {
    //     throw Error(`
    //     Found duplicate user best submissions: ${submission.userId} for exercise: ${submission.exercise.id}
    //     `);
    // }
    // if (bestUserSubmissions.length === 0) {
    //     functions.logger.info(`
    //     Best submission for user: ${submission.userId}, exercise ${submission.exercise.id} does not exist
    //     `);
    //     submissionRes.isBest = true;
    // }
    // if (bestUserSubmissions.length === 1) {
    //     const bestRecord = bestUserSubmissions[0] as SubmissionResult;
    //     bestRecord.id = bestUserSubmissionsSnapshot.docs[0].id;
    //     if (bestRecord.status === 'Solved') {
    //         alreadySolved = true;
    //     }
    //
    //     if (bestRecord.score < submissionRes.score ||
    //         bestRecord.score === submissionRes.score && bestRecord.time > submissionRes.time) {
    //         functions.logger.info(`Updating the previous best: ${JSON.stringify(bestRecord)}`);
    //
    //         await app.firestore()
    //             .collection('submissions')
    //             .doc(bestRecord.id)
    //             .set({isBest: false}, {merge: true});
    //         submissionRes.isBest = true;
    //         functions.logger.info(`Updated the previous best: ${bestRecord.id}`);
    //     } else {
    //         functions.logger.info('Did not update the bestSubmissions list');
    //     }
    // }
    //
    // // save the results to /submissions
    // await app.firestore().collection('submissions').doc(id).set(submissionRes, {merge: true});
    // // save the sensitive information to /submissions/${submissionId}/private/${userId}
    // const sensitiveData = {code: code};
    // await app.firestore().collection(`submissions/${id}/private`).doc(submission.userId).set(sensitiveData);
    // functions.logger.info(`Saved the submission: ${JSON.stringify(code)}`);
    //
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
    // // update user activity
    // if (!alreadySolved && submissionResult.status === 'Solved') {
    //     functions.logger.info('Updating the user activity...');
    //     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //     // @ts-ignore
    //     const submissionDate = submissionResult.createdAt.toDate();
    //     const submissionDay = moment(submissionDate).format('YYYY-MM-DD');
    //
    //     await app.firestore()
    //         .collection(`users/${submission.userId}/activity`)
    //         .doc(submissionDay)
    //         .set({
    //             count: admin.firestore.FieldValue.increment(1),
    //             date: submissionDay,
    //         }, {merge: true});
    //     functions.logger.info('Updated the user activity!');
    // }
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


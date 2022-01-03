import {firestore} from 'firebase-admin';
import * as admin from 'firebase-admin';
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
    if (submission.status !== 'Solved') {
        functions.logger.info(`Not updating user activity. Status: ${submission.status}`);
        return;
    }

    functions.logger.info('Updating the user activity...');
    const submissionDate = submission.createdAt.toDate();
    const submissionDay = moment(submissionDate).format('YYYY-MM-DD');

    transaction.set(db.activity(submission.userId).doc(submissionDay), {
        // @ts-ignore
        count: firestore.FieldValue.increment(1),
        date: submissionDay,
    }, {merge: true});
    functions.logger.info('Updated the user activity!');
};


const updateUserMetric = (
    transaction: firestore.Transaction,
    metric: string,
    userId: string,
    courseId: string,
    exerciseId: string,
    level: string,
    prev: number,
    cur: number,
    res: number | string,
) => {
    if (cur < prev) {
        functions.logger.info(`Not updating: ${metric} prev: ${prev}, cur: ${cur}`);
        return;
    }

    const uppercaseMetric = metric.charAt(0).toUpperCase() + metric.slice(1);
    functions.logger.info(`Updating metric: ${metric} with prev ${prev} to cur ${cur}`);
    transaction.set(db.userProgress(courseId, userId), {
        [metric]: firestore.FieldValue.increment(cur - prev),
        [`level${uppercaseMetric}`]: {[level]: firestore.FieldValue.increment(cur - prev)},
    }, {merge: true});
    transaction.set(db.userProgress(courseId, userId).collection(`exercise${uppercaseMetric}`).doc(level), {
        // workaround to be able to do Collection-Group queries
        'userId': userId,
        'courseId': courseId,
        'level': level,
        'progress': {[exerciseId]: res},
    }, {merge: true});
};


export const processSubmissionResult = async (
    submissionResult: SubmissionResult,
    isTestRun: boolean,
    userId: string
): Promise<void> => {
    const {code, ...submissionRes} = submissionResult;

    if (isTestRun) {
        // save the results to /runs/userId/private/<submissionId>
        functions.logger.info(`Updating the run: ${submissionResult.id} with ${JSON.stringify(submissionRes)}`);
        await db.run(userId, submissionResult.id).set(submissionRes);
        return;
    }
    const [courseSnapshot, exerciseSnapshot, user] = await Promise.all([
        db.course(submissionResult.course.id).get(),
        db.exercise(submissionResult.course.id, submissionResult.exercise.id).get(),
        admin.auth().getUser(submissionResult.userId),
    ]);
    const course = courseSnapshot.data();
    const exercise = exerciseSnapshot.data();
    if (!course)
        throw Error(`Course with id ${submissionResult.course.id} does not exist`);
    if (!exercise)
        throw Error(`Exercise with id ${submissionResult.exercise.id} does not exist`);

    const status = typeof submissionResult.status === 'string' ? submissionResult.status :
        submissionResult.status.reduce((prev, cur) => cur === 'Solved' ? prev : cur, 'Solved');
    const level = Math.floor(exercise.order).toString();
    submissionResult.userDisplayName = submissionRes.userDisplayName = user.displayName;
    submissionResult.userImageUrl = submissionRes.userImageUrl = user.photoURL;
    submissionResult.courseTitle = submissionRes.courseTitle = course.title;
    submissionResult.exerciseTitle = submissionRes.exerciseTitle = exercise.title;


    functions.logger.info(`Updating the submission: ${submissionResult.id} with ${JSON.stringify(submissionResult)}`);
    // Update the best submissions
    await firestore().runTransaction(async (transaction) => {
        const bestUserSubmissionsRef = db.submissionResults
            .where('isBest', '==', true)
            .where('userId', '==', submissionResult.userId)
            .where('exercise', '==', submissionResult.exercise);

        const bestUserSubmissions = (await transaction.get(bestUserSubmissionsRef)).docs.map((s) => s.data());
        let alreadySolved = false;

        if (bestUserSubmissions.length > 1)
            throw Error(`Duplicate user best: ${submissionResult.userId} for ex: ${submissionResult.exercise.id}`);

        const currentBest = bestUserSubmissions.length === 1 ? bestUserSubmissions[0] : undefined;
        if (currentBest?.status === 'Solved')
            alreadySolved = true;

        console.log(`Already solved (${submissionResult.id}): ${alreadySolved}`);
        updateBest(transaction, submissionRes, currentBest);

        // save the sensitive information to /submissions/${submissionId}/private/${userId}
        const sensitiveData = {code: code};
        transaction.set(db.submissionSensitiveRecords(submissionResult.userId, submissionResult.id), sensitiveData);
        functions.logger.info(`Saved the submission: ${JSON.stringify(code)}`);

        if (!alreadySolved)
            updateActivity(transaction, submissionRes);
    });

    // another transaction to update user metrics
    await firestore().runTransaction(async (transaction) => {
        const prevSolved = (await transaction.get(db.userProgress(course.id, userId)
            .collection('exerciseSolved').doc(level))).data();
        functions.logger.info(`prevSolved: ${JSON.stringify(prevSolved)}`);

        if (course.freezeAt > submissionResult.createdAt ) {
            const prevScore = (await transaction.get(db.userProgress(course.id, userId)
                .collection('exerciseScore').doc(level))).data();
            functions.logger.info(`prevScore: ${JSON.stringify(prevScore)}`);
            updateUserMetric(transaction, 'score', submissionResult.userId, course.id, exercise.id, level,
                prevScore?.progress?.[exercise.id] ?? 0, submissionResult.score, submissionResult.score);
        } else {
            const prevScore = (await transaction.get(db.userProgress(course.id, userId)
                .collection('exerciseUpsolveScore').doc(level))).data();
            functions.logger.info(`prevScore: ${JSON.stringify(prevScore)}`);
            updateUserMetric(transaction, 'upsolveScore', submissionResult.userId, course.id, exercise.id, level,
                prevScore?.progress?.[exercise.id] ?? 0, submissionResult.score, submissionResult.score);
        }

        updateUserMetric(transaction, 'solved', submissionResult.userId, course.id, exercise.id, level,
            prevSolved?.progress?.[exercise.id] === 'Solved' ? 1 : 0, status === 'Solved' ? 1 : 0, status);
        transaction.set(db.userProgress(course.id, user.uid), {
            userDisplayName: user.displayName,
            userImageUrl: user.photoURL,
        }, {merge: true});
    });
};


export const submit = async (submission: Submission): Promise<void> => {
    const problem = submission.exercise.id;
    if (!submission.isTestRun && submission.testCases)
        throw Error('Final submissions cannot have test cases');

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
    const res = await needle('post', AWS_LAMBDA_URL, JSON.stringify(data), {open_timeout: 100});
    functions.logger.info(`res: ${JSON.stringify(res.body)}`);

    const submissionResult = {
        ...res.body,
        ...submission,
        isBest: false,
    } as SubmissionResult;
    functions.logger.info(`submissionResult: ${JSON.stringify(submissionResult)}`);

    await processSubmissionResult(submissionResult, submission.isTestRun, submission.userId);
};

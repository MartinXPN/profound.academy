import * as functions from 'firebase-functions';
import * as https from 'https';
import * as http from 'node:http';
import * as needle from 'needle';
import {firestore} from 'firebase-admin';

import {db} from './db';
import {Course} from '../models/courses';
import {Exercise} from '../models/exercise';
import {Submission, SubmissionResult} from '../models/submissions';
import {processResult} from './submissionResults';
import {recordNewUserInsight, updateUserProgress} from './metrics';

// const LAMBDA_JUDGE_URL='https://judge.profound.academy/check';
const LAMBDA_JUDGE_URL='https://239loy8zo4.execute-api.us-east-1.amazonaws.com/Prod/check/';
const PROCESS_SUBMISSION_CALLBACK_URL='https://us-central1-profound-academy.cloudfunctions.net/processSubmissionResult';
const LOCALHOST = functions.config()?.host === 'local';


const submitLambdaJudge = async (submission: Submission, exercise: Exercise): Promise<http.ClientRequest | void> => {
    const callbackUrl = LOCALHOST ? null : `${PROCESS_SUBMISSION_CALLBACK_URL}/${submission.userId}/${submission.id}`;
    const data = {
        problem: submission.testCases ? undefined : submission.exercise.id,
        testCases: submission.testCases,
        code: submission.code,
        language: submission.language,
        memoryLimit: exercise?.memoryLimit ?? 512,
        timeLimit: exercise?.timeLimit ?? 2,
        outputLimit: exercise?.outputLimit ?? 1,
        returnOutputs: submission.isTestRun,
        stopOnFirstFail: submission.isTestRun ? false : !exercise?.testGroups,
        testGroups: submission.isTestRun ? undefined : exercise?.testGroups,
        comparisonMode: exercise?.comparisonMode ?? 'token',
        floatPrecision: exercise?.floatPrecision ?? 0.001,
        callbackUrl: callbackUrl,
    };
    const dataString = JSON.stringify(data);
    functions.logger.info(`submitting data: ${dataString}`);

    // if running locally, do not process through callback URL as we won't get the response that way
    if (LOCALHOST) {
        functions.logger.info('Submitting from local to LambdaJudge');
        const judgeResult = await needle('post', LAMBDA_JUDGE_URL, dataString, {open_timeout: 1000});
        functions.logger.info(`res: ${JSON.stringify(judgeResult.body)}`);
        return processResult(judgeResult.body, submission.userId, submission.id);
    }

    return new Promise((resolve) => {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(dataString, 'utf-8'),
            },
            timeout: 1000, // in ms
        };

        const req = https.request(LAMBDA_JUDGE_URL, options);
        req.write(dataString, 'utf-8');
        functions.logger.info(`req: ${JSON.stringify(req)}`);
        req.end(() => resolve(req));
        functions.logger.info('Done!');
    });
};

const submitAnswerCheck = async (submission: Submission) => {
    const target = (await db.exercisePrivateFields(submission.course.id, submission.exercise.id).get()).data()?.answer;
    const answer = Object.values(submission.code ?? {})[0];
    functions.logger.info(`The answer was: ${answer} with target: ${target}`);

    if (!target)
        throw Error(`The exercise ${submission.exercise.id} does not have an answer`);

    const isCorrect = answer.trim() === target.trim();
    return processResult({overall: {
        ...submission,
        status: isCorrect ? 'Solved' : 'Wrong answer',
        memory: 0, time: 0, score: isCorrect ? 100 : 0, returnCode: 0,
    }}, submission.userId, submission.id);
};

// eslint-disable-next-line valid-jsdoc
/**
 * Checks if it's allowed to make a submission.
 * If the allowed number of submissions is exceeded, the function returns false
 * Otherwise, the number of attempts is increased in the firestore
 */
const attemptSubmit = async (submission: Submission, course: Course, exercise: Exercise): Promise<boolean> => {
    if (submission.isTestRun)
        return true;

    const levelName = Math.trunc(exercise.order).toString();
    return await firestore().runTransaction(async (transaction) => {
        // new attempt
        const attempts = (await transaction.get(db.userProgress(course.id, submission.userId)
            .collection('exerciseAttempts').doc(levelName))).data();
        functions.logger.info(`Attempts: ${JSON.stringify(attempts)}`);
        const numAttempts = attempts?.progress?.[exercise.id] ?? 0;
        const allowedAttempts = exercise?.allowedAttempts ?? 100;
        functions.logger.info(`#Attempts: ${numAttempts}, Allowed attempts: ${allowedAttempts}`);

        // new submission
        const user = (await db.user(submission.userId).get()).data();
        await recordNewUserInsight(transaction, submission.userId, submission.course.id, submission.createdAt.toDate());
        const submissionResult = {
            ...submission,
            userDisplayName: user?.displayName ?? '',
            userImageUrl: user?.imageUrl ?? '',
            status: 'Checking',
            isBest: false, memory: 0, time: 0, score: 0,
            courseTitle: course.title,
            exerciseTitle: exercise.title,
        } as SubmissionResult;

        // Do not allow a new attempts if the number exceeds the allowed threshold
        if (allowedAttempts <= numAttempts) {
            functions.logger.info('Do not allow this submission');
            transaction.set(db.submissionResult(submission.id), {...submissionResult, status: 'Unavailable',
                message: `Exceeded the number of allowed attempts (${allowedAttempts})`,
            });
            return false;
        }
        updateUserProgress(transaction, 'attempts', submission.userId, course.id, exercise.id, levelName,
            numAttempts, numAttempts + 1, numAttempts + 1);
        functions.logger.info(`Updated attempts to ${numAttempts + 1}`);

        transaction.set(db.submissionResult(submission.id), submissionResult);
        return true;
    });
};

export const submit = async (submission: Submission): Promise<http.ClientRequest | void> => {
    if (!submission.isTestRun && submission.testCases)
        throw Error('Final submissions cannot have test cases');

    const course = (await db.course(submission.course.id).get()).data();
    const exercise = (await db.exercise(submission.course.id, submission.exercise.id).get()).data();
    functions.logger.info(`submission exercise: ${JSON.stringify(exercise)}`);
    if (!exercise || !course)
        throw Error(`Exercise or course do not exist: ${submission.exercise.id} ${submission.course.id}`);

    const canSubmit = await attemptSubmit(submission, course, exercise);
    if (!canSubmit)
        return;

    functions.logger.info('Submitting solution to the judge...');
    if (submission.language === 'txt')
        return submitAnswerCheck(submission);
    return submitLambdaJudge(submission, exercise);
};

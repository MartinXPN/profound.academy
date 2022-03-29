import * as functions from 'firebase-functions';
import * as https from 'https';
import * as http from 'node:http';
import * as moment from 'moment';
import * as needle from 'needle';
import * as admin from 'firebase-admin';
import {firestore} from 'firebase-admin';
import {updateUserMetric} from './metrics';
import {db} from './db';
import {Submission} from '../models/submissions';
import {Exercise} from '../models/exercise';
import {processResult} from './submissionResults';
import {recordNewUserInsight} from './insights';

// const LAMBDA_JUDGE_URL='https://judge.profound.academy/check';
const LAMBDA_JUDGE_URL='https://jdc8h3yyag.execute-api.us-east-1.amazonaws.com/Prod/check/';
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
        aggregateResults: !submission.isTestRun,
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

export const submit = async (submission: Submission): Promise<http.ClientRequest | void> => {
    if (!submission.isTestRun && submission.testCases)
        throw Error('Final submissions cannot have test cases');

    const course = (await db.course(submission.course.id).get()).data();
    const exercise = (await db.exercise(submission.course.id, submission.exercise.id).get()).data();
    functions.logger.info(`submission exercise: ${JSON.stringify(exercise)}`);
    if (!exercise || !course)
        throw Error(`Exercise or course do not exist: ${submission.exercise.id} ${submission.course.id}`);

    const levelName = Math.trunc(exercise.order).toString();
    const canSubmit = submission.isTestRun || await firestore().runTransaction(async (transaction) => {
        // new attempt
        const attempts = (await transaction.get(db.userProgress(course.id, submission.userId)
            .collection('exerciseAttempts').doc(levelName))).data();
        functions.logger.info(`Attempts: ${JSON.stringify(attempts)}`);
        const numAttempts = attempts?.progress?.[exercise.id] ?? 0;
        const allowedAttempts = exercise?.allowedAttempts ?? 100;
        functions.logger.info(`#Attempts: ${numAttempts}, Allowed attempts: ${allowedAttempts}`);

        // new submission
        await recordNewUserInsight(transaction, submission.userId, submission.course.id, submission.createdAt.toDate());

        // Do not allow a new attempts if the number exceeds the allowed threshold
        if (allowedAttempts <= numAttempts) {
            functions.logger.info('Do not allow this submission');
            const user = await admin.auth().getUser(submission.userId);
            transaction.set(db.submissionResult(submission.id), {
                ...submission,
                userDisplayName: user.displayName,
                userImageUrl: user.photoURL,
                status: 'Unavailable',
                isBest: false, memory: 0, time: 0, score: 0,
                message: `Exceeded the number of allowed attempts (${allowedAttempts})`,
                courseTitle: course.title,
                exerciseTitle: exercise.title,
            });
            return false;
        }
        updateUserMetric(transaction, 'attempts', submission.userId, course.id, exercise.id, levelName,
            numAttempts, numAttempts + 1, numAttempts + 1);
        functions.logger.info(`Updated attempts to ${numAttempts + 1}`);
        return true;
    });

    if (!canSubmit)
        return;

    functions.logger.info('Submitting solution to the judge...');
    if (submission.language === 'txt')
        return submitAnswerCheck(submission);
    return submitLambdaJudge(submission, exercise);
};

export const reEvaluate = async (courseId: string, exerciseId: string): Promise<void> => {
    functions.logger.info(`Re-evaluating submissions for ${courseId} ${exerciseId}`);
    const courseRef = db.course(courseId);
    const exerciseRef = db.exercise(courseId, exerciseId);
    const exercise = (await exerciseRef.get()).data();
    if (!exercise)
        return;

    const level = Math.trunc(exercise.order).toString();

    return firestore().runTransaction(async (transaction) => {
        const query = await transaction.get(db.submissionResults.where('exercise', '==', exerciseRef));
        const submissions = query.docs.map((s) => s.data());
        console.log('#submissions:', submissions.length);

        const newSubmissions = await Promise.all(submissions.map(async (submission) => {
            const sensitiveRecordsRef = db.submissionSensitiveRecords(submission.userId, submission.id);
            const code = (await transaction.get(sensitiveRecordsRef)).data()?.code;
            if (!code)
                return null;
            return {
                id: submission.id,
                code: code,
                course: courseRef,
                createdAt: submission.createdAt,
                exercise: exerciseRef,
                isTestRun: submission.isTestRun,
                language: submission.language,
                userDisplayName: submission.userDisplayName,
                userId: submission.userId,
            };
        }));
        const users = new Set(newSubmissions.map((s) => s?.userId));
        console.log('users:', users);

        const prevData = await Promise.all(Array.from(users).map(async (user) => {
            if (!user)
                return;
            return Promise.all([
                user,
                (await transaction.get(db.userProgress(courseId, user)
                    .collection('exerciseSolved').doc(level))).data(),
                (await transaction.get(db.userProgress(courseId, user)
                    .collection('exerciseScore').doc(level))).data(),
                (await transaction.get(db.userProgress(courseId, user)
                    .collection('exerciseUpsolveScore').doc(level))).data(),
                (await transaction.get(db.userProgress(courseId, user)
                    .collection('exerciseAttempts').doc(level))).data(),
            ]);
        }));

        // reset user metrics
        await Promise.all(prevData.map(async (data) => {
            if (!data)
                return;
            const [user, prevSolved, prevScore, upsolveScore, prevAttempts] = data;
            const weekly = moment().format('YYYY_MM_WW');
            functions.logger.info(`weekly score path: ${weekly}`);
            console.log('user:', user);  // , 'prevSolved:', prevSolved, 'upsolve:', upsolveScore

            updateUserMetric(transaction, 'solved', user, courseId, exerciseId, level,
                prevSolved?.progress?.[exerciseId] === 'Solved' ? 1 : 0, 0, 0, true);

            updateUserMetric(transaction, 'score', user, courseId, exerciseId, level,
                prevScore?.progress?.[exerciseId] ?? 0, 0, 0, true);

            updateUserMetric(transaction, `score_${weekly}`, user, courseId, exerciseId, level,
                prevScore?.progress?.[exerciseId] ?? 0, 0, 0, true);

            updateUserMetric(transaction, 'upsolveScore', user, courseId, exerciseId, level,
                upsolveScore?.progress?.[exerciseId] ?? 0, 0, 0, true);

            updateUserMetric(transaction, 'attempts', user, courseId, exerciseId, level,
                prevAttempts?.progress?.[exerciseId] ?? 0, 0, 0, true);
        }));

        // submit again
        await Promise.all(newSubmissions.map(async (submission) => {
            if (!submission)
                return;
            const {id, ...submissionData} = submission;
            const ref = db.submissionQueue(submission.userId).doc();
            // @ts-ignore
            transaction.set(ref, submissionData);
            console.log('added doc with id:', ref.id, ' -- removed doc with id:', id);
            transaction.delete(db.submissionResult(id));
        }));
    });
};

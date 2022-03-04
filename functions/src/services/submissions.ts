import * as functions from 'firebase-functions';
import * as https from 'https';
import * as http from 'node:http';
import * as moment from 'moment';
import {db} from './db';
import {Submission} from '../models/submissions';
import {Exercise} from '../models/courses';
import {processResult} from './submissionResults';
import {recordNewUserInsight} from './insights';
import {firestore} from 'firebase-admin';
import {updateUserMetric} from './metrics';

// const LAMBDA_JUDGE_URL='https://judge.profound.academy/check';
const LAMBDA_JUDGE_URL='https://jdc8h3yyag.execute-api.us-east-1.amazonaws.com/Prod/check/';
const PROCESS_SUBMISSION_CALLBACK_URL='https://us-central1-profound-academy.cloudfunctions.net/processSubmissionResult';


const submitLambdaJudge = async (submission: Submission, exercise: Exercise): Promise<http.ClientRequest> => {
    const problem = submission.exercise.id;
    const data = {
        problem: !submission.testCases ? problem : undefined,
        testCases: submission.testCases,
        code: submission.code,
        language: submission.language,
        memoryLimit: exercise?.memoryLimit ?? 512,
        timeLimit: exercise?.timeLimit ?? 2,
        outputLimit: exercise?.outputLimit ?? 1,
        aggregateResults: !submission.isTestRun,
        returnOutputs: submission.isTestRun,
        stopOnFirstFail: !submission.isTestRun,
        comparisonMode: exercise?.comparisonMode ?? 'token',
        floatPrecision: exercise?.floatPrecision ?? 0.001,
        callbackUrl: `${PROCESS_SUBMISSION_CALLBACK_URL}/${submission.userId}/${submission.id}`,
    };
    functions.logger.info(`submitting data: ${JSON.stringify(data)}`);

    return new Promise((resolve) => {
        const dataString = JSON.stringify(data);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': dataString.length,
            },
            timeout: 1000, // in ms
        };

        const req = https.request(LAMBDA_JUDGE_URL, options);
        req.write(dataString);
        functions.logger.info(`req: ${JSON.stringify(req)}`);
        req.end(() => resolve(req));
        functions.logger.info('done:');
    });
};

const submitAnswerCheck = async (submission: Submission, exercise: Exercise) => {
    const course = (await db.course(submission.course.id).get()).data();
    const target = (await db.exercisePrivateFields(submission.course.id, submission.exercise.id).get()).data()?.answer;
    const answer = Object.values(submission.code ?? {})[0];
    functions.logger.info(`The answer was: ${answer} with target: ${target}`);

    if (!target) throw Error(`The exercise ${submission.exercise.id} does not have an answer`);
    if (!course) throw Error(`The course ${submission.course.id} does not exist`);

    const isCorrect = answer.trim() === target.trim();
    return processResult({
        ...submission,
        isBest: false,
        status: isCorrect ? 'Solved' : 'Wrong answer',
        memory: 0, time: 0,
        score: isCorrect ? (exercise.score ?? 100) : 0,  // TODO: move this to processResult()
        courseTitle: course.title,
        exerciseTitle: exercise.title,
    }, submission.userId, submission.id);
};

export const submit = async (submission: Submission): Promise<http.ClientRequest | void> => {
    if (!submission.isTestRun && submission.testCases)
        throw Error('Final submissions cannot have test cases');

    const exercise = (await db.exercise(submission.course.id, submission.exercise.id).get()).data();
    functions.logger.info(`submission exercise: ${JSON.stringify(exercise)}`);
    if (!exercise)
        throw Error(`Exercise does not exist: ${submission.exercise.id}`);

    await firestore().runTransaction(async (transaction) => {
        await recordNewUserInsight(transaction, submission.userId, submission.course.id, submission.createdAt.toDate());
    });
    // TODO: Add number of attempts check here
    if (submission.language === 'txt')
        return submitAnswerCheck(submission, exercise);
    return submitLambdaJudge(submission, exercise);
};

export const reEvaluate = async (courseId: string, exerciseId: string): Promise<void> => {
    functions.logger.info(`Re-evaluating submissions for ${courseId} ${exerciseId}`);
    const courseRef = db.course(courseId);
    const exerciseRef = db.exercise(courseId, exerciseId);
    const exercise = (await exerciseRef.get()).data();
    if (!exercise)
        return;

    const level = Math.floor(exercise.order).toString();

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
            ]);
        }));

        // reset user metrics
        await Promise.all(prevData.map(async (data) => {
            if (!data)
                return;
            const [user, prevSolved, prevScore, upsolveScore] = data;
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

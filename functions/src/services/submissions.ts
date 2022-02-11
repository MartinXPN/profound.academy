import * as functions from 'firebase-functions';
import * as https from 'https';
import * as http from 'node:http';
import {db} from './db';
import {Submission} from '../models/submissions';
import {Exercise} from '../models/courses';
import {processResult} from './submissionResults';

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
    const target = (await db.exercisePrivateFields(submission.course.id, submission.exercise.id).get()).data();
    const answer = Object.values(submission.code ?? {})[0];
    functions.logger.info(`The answer was: ${answer} with target: ${target}`);

    if (!target) throw Error(`The exercise ${submission.exercise.id} does not have an answer`);
    if (!course) throw Error(`The course ${submission.course.id} does not exist`);

    const isCorrect = answer.trim() === target.answer?.trim();
    return processResult({
        ...submission,
        isBest: false,
        status: isCorrect ? 'Solved' : 'Wrong answer',
        memory: 0, time: 0,
        score: isCorrect ? (exercise.score ?? 100) : 0,
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

    // TODO: Add number of attempts check here
    if (submission.language === 'txt')
        return submitAnswerCheck(submission, exercise);
    return submitLambdaJudge(submission, exercise);
};

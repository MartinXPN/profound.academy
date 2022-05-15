import * as functions from 'firebase-functions';
import * as moment from 'moment';
import {firestore} from 'firebase-admin';

import {db} from './db';
import {JudgeResult, SubmissionResult} from '../models/submissions';
import {Course} from '../models/courses';
import {Exercise} from '../models/exercise';
import {User} from '../models/users';
import {updateUserProgress, recordInsights} from './metrics';


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

    // save the results to /submissions
    transaction.set(db.submissionResult(submission.id), submission);
};

const updateActivity = (
    transaction: firestore.Transaction,
    submission: SubmissionResult,
) => {
    if (submission.status !== 'Solved')
        return functions.logger.info(`Not updating user activity. Status: ${submission.status}`);

    functions.logger.info('Updating the user activity...');
    const submissionDate = submission.createdAt.toDate();
    const submissionDay = moment(submissionDate).format('YYYY-MM-DD');
    const year = moment(submissionDate).format('YYYY');

    // @ts-ignore
    transaction.set(db.activity(submission.userId).doc(year), {
        [submissionDay]: firestore.FieldValue.increment(1),
    }, {merge: true});
    functions.logger.info('Updated the user activity!');
};

const unlockContent = (
    transaction: firestore.Transaction,
    submission: SubmissionResult,
    exercise: Exercise,
    user?: User,
) => {
    if (!user)
        return functions.logger.info(`No user to unlock content. Submission: ${submission.id}`);
    if (submission.status !== 'Solved')
        return functions.logger.info(`Not unlocking content. Status: ${submission.status}`);
    if (!exercise.unlockContent || exercise.unlockContent.length === 0)
        return functions.logger.info(`Exercise ${exercise.id} does not have content to unlock`);

    const isIn = (courseId: string, courses?: Course[]) => courses && courses
        .filter((c) => c.id === courseId).length > 0;

    const unlockedCourses = exercise.unlockContent
        .filter((courseId) => !isIn(courseId, user.courses) && !isIn(courseId, user.completed))
        .map((courseId) => db.course(courseId));
    functions.logger.info(`There are ${unlockedCourses.length} courses to unlock!`);

    if (unlockedCourses.length === 0)
        return;

    // TODO: user addCourses() instead
    if (user.courses && user.courses.length > 0) {
        functions.logger.info('Adding course to pre-existing list of courses');
        transaction.update(db.user(user.id), {
            courses: firestore.FieldValue.arrayUnion(...unlockedCourses),
        });
    } else {
        functions.logger.info('Adding courses from scratch');
        transaction.update(db.user(user.id), {
            courses: [unlockedCourses],
        });
    }

    // Update submissionResult message
    functions.logger.info('Updating submissionResult message...');
    transaction.update(db.submissionResult(submission.id), {
        message: 'Congratulations! You have unlocked new content!\nGo to homepage to view it',
    });
};


export const processResult = async (
    judgeResult: JudgeResult,
    userId: string,
    submissionId: string,
): Promise<void> => {
    functions.logger.info(`res for user ${userId}, submission ${submissionId}: ${JSON.stringify(judgeResult)}`);
    const submission = (await db.submissionQueue(userId).doc(submissionId).get()).data();
    if (!submission) throw Error(`Submission ${submissionId} was not found`);
    if (!judgeResult) throw Error('Submission result is null');

    const [course, exercise, user] = await Promise.all([
        (await db.course(submission.course.id).get()).data(),
        (await db.exercise(submission.course.id, submission.exercise.id).get()).data(),
        (await db.user(submission.userId).get()).data(),
    ]);
    if (!course) throw Error(`Course with id ${submission.course.id} does not exist`);
    if (!exercise) throw Error(`Exercise with id ${submission.exercise.id} does not exist`);

    const testResults = judgeResult.testResults ?? [];
    const {code, ...submissionResult}: SubmissionResult = {
        ...submission, ...judgeResult.overall,
        id: submissionId, isBest: false,
        compileResult: judgeResult.compileResult,
        courseTitle: course.title, exerciseTitle: exercise.title,
        userImageUrl: user?.imageUrl ?? '',
        userDisplayName: user?.displayName ?? '',
    };
    functions.logger.info(`submissionResult: ${JSON.stringify(submissionResult)}`);
    const submissionDate = submissionResult.createdAt.toDate();
    const level = Math.trunc(exercise.order).toString();

    if (submissionResult.isTestRun) {
        // save the results to /runs/userId/private/<submissionId>
        functions.logger.info(`Updating the run: ${submissionResult.id} with ${JSON.stringify(submissionResult)}`);
        return await firestore().runTransaction(async (transaction) => {
            transaction.set(db.run(userId, submissionResult.id), submissionResult);
            transaction.set(db.runTestResults(userId, submissionId), {testResults: testResults});
            recordInsights(transaction, 'runs', course.id, exercise.id, submissionDate);
        });
    }

    functions.logger.info(`Setting the score to exerciseScore instead of judgeScore (${submissionResult.score})...`);
    submissionResult.score = submissionResult.score / 100.0 * (exercise.score ?? 100);
    functions.logger.info(`Exercise score is set to: ${submissionResult.score}`);

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

        functions.logger.info(`Already solved (${submissionResult.id}): ${alreadySolved}`);
        updateBest(transaction, submissionResult, currentBest);

        // save the sensitive information to /submissions/${submissionId}/private/${userId}
        const sensitiveData = {code: code};
        transaction.set(db.submissionSensitiveRecords(userId, submissionResult.id), sensitiveData);
        transaction.set(db.submissionTestResults(userId, submissionResult.id), {testResults: testResults});
        functions.logger.info(`Saved the submission: ${JSON.stringify(code)}`);

        // update insights and activity
        recordInsights(transaction, 'submissions', course.id, exercise.id, submissionDate);
        recordInsights(transaction, 'totalScore', course.id, exercise.id, submissionDate, submissionResult.score);
        if (submissionResult.status === 'Solved')
            recordInsights(transaction, 'solved', course.id, exercise.id, submissionDate);
        if (!alreadySolved) {
            updateActivity(transaction, submissionResult);
            unlockContent(transaction, submissionResult, exercise, user);
        }
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
            updateUserProgress(transaction, 'score', submissionResult.userId, course.id, exercise.id, level,
                prevScore?.progress?.[exercise.id] ?? 0, submissionResult.score, submissionResult.score);
            // update weekly score metrics
            const weekly = moment(submissionDate).format('YYYY_MM_WW');
            functions.logger.info(`weekly score path: ${weekly}`);
            updateUserProgress(transaction, `score_${weekly}`,
                submissionResult.userId, course.id, exercise.id, level,
                prevScore?.progress?.[exercise.id] ?? 0, submissionResult.score, submissionResult.score);
        } else {
            const prevScore = (await transaction.get(db.userProgress(course.id, userId)
                .collection('exerciseUpsolveScore').doc(level))).data();
            functions.logger.info(`prevScore: ${JSON.stringify(prevScore)}`);
            updateUserProgress(transaction, 'upsolveScore', submissionResult.userId, course.id, exercise.id, level,
                prevScore?.progress?.[exercise.id] ?? 0, submissionResult.score, submissionResult.score);
        }

        updateUserProgress(transaction, 'solved', submissionResult.userId, course.id, exercise.id, level,
            prevSolved?.progress?.[exercise.id] === 'Solved' ? 1 : 0,
            submissionResult.status === 'Solved' ? 1 : 0, submissionResult.status);
        transaction.set(db.userProgress(course.id, submissionResult.userId), {
            userDisplayName: submissionResult.userDisplayName,
            userImageUrl: submissionResult.userImageUrl,
        }, {merge: true});
    });
};

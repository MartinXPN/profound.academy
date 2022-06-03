import * as functions from 'firebase-functions';
import * as moment from 'moment';
import {firestore} from 'firebase-admin';

import {db} from './db';
import {JudgeResult, SubmissionResult} from '../models/submissions';
import {Course} from '../models/courses';
import {Exercise} from '../models/exercise';
import {User} from '../models/users';
import {updateUserProgress, recordInsights} from './metrics';
import {addCourses} from './users';
import {dateDayDiff} from "./util";


const updateBest = async (submission: SubmissionResult): Promise<boolean> => {
    functions.logger.info('Updating the best submissions...');
    return await firestore().runTransaction(async (transaction) => {
        const bestUserSubmissionsRef = db.submissionResults
            .where('isBest', '==', true)
            .where('userId', '==', submission.userId)
            .where('exercise', '==', submission.exercise);

        const bestUserSubmissions = (await transaction.get(bestUserSubmissionsRef)).docs.map((s) => s.data());
        let alreadySolved = false;
        if (bestUserSubmissions.length > 1)
            throw Error(`Duplicate user best: ${submission.userId} for ex: ${submission.exercise.id}`);

        const currentBest = bestUserSubmissions.length === 1 ? bestUserSubmissions[0] : undefined;
        if (currentBest?.status === 'Solved')
            alreadySolved = true;

        functions.logger.info(`Already solved (${submission.id}): ${alreadySolved}`);

        if (!currentBest) {
            submission.isBest = true;
            functions.logger.info('No best submissions before this => setting to best');
        } else if (currentBest.score < submission.score ||
            currentBest.score === submission.score && currentBest.time > submission.time) {
            functions.logger.info(`Updating the previous best: ${JSON.stringify(currentBest)}`);

            transaction.set(db.submissionResult(currentBest.id), {isBest: false}, {merge: true});
            submission.isBest = true;
            functions.logger.info(`Updated the previous best: ${currentBest.id}`);
        } else {
            functions.logger.info('Did not update the bestSubmissions list');
        }

        // save the results to /submissions
        transaction.set(db.submissionResult(submission.id), submission);
        return alreadySolved;
    });
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

const unlockContent = async (
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

    const unlockedCourseIds = exercise.unlockContent
        .filter((courseId) => !isIn(courseId, user.courses) && !isIn(courseId, user.completed));
    functions.logger.info(`There are ${unlockedCourseIds.length} courses to unlock!`);

    if (unlockedCourseIds.length === 0)
        return;
    await addCourses(transaction, unlockedCourseIds, user);

    // Update submissionResult message
    functions.logger.info('Updating submissionResult message...');
    transaction.update(db.submissionResult(submission.id), {
        message: 'Congratulations! You have unlocked new content!\nGo to homepage to view it',
    });

    // Add the user to the list of invited users for each unlocked course
    await Promise.all(unlockedCourseIds.map(async (courseId) => {
        functions.logger.info(`Adding the user ${user.id} to the invited list for course ${courseId}`);
        transaction.set(db.coursePrivateFields(courseId), {
            // @ts-ignore
            invitedUsers: firestore.FieldValue.arrayUnion(user.id),
        }, {merge: true});
    }));
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

    const alreadySolved = await updateBest(submissionResult);
    await firestore().runTransaction(async (transaction) => {
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
            await unlockContent(transaction, submissionResult, exercise, user);
        }
    });

    // another transaction to update user metrics
    await firestore().runTransaction(async (transaction) => {
        const getProgress = async (metric: string) => {
            return (await transaction.get(db.userProgress(course.id, userId).collection(metric).doc(level))).data();
        }
        const setProgress = (metric: string, prev: number, cur: number, res: number | string, rollbackDate?: Date) =>
            updateUserProgress(
                transaction, metric, submissionResult.userId, course.id, exercise.id, level,
                prev, cur, res, false, rollbackDate
            );

        const rankingActive = course.freezeAt > submissionResult.createdAt;
        const submissionDate = submissionResult.createdAt.toDate();
        const prevSolved = await getProgress('exerciseSolved');
        const prevScore = await getProgress(rankingActive ? 'exerciseScore': 'exerciseUpsolveScore');
        functions.logger.info(`prevSolved: ${JSON.stringify(prevSolved)}`);
        functions.logger.info(`prevScore: ${JSON.stringify(prevScore)}`);

        /* eslint-disable max-len, @typescript-eslint/explicit-module-boundary-types */
        setProgress(rankingActive ? 'score' : 'upsolveScore', prevScore?.progress?.[exercise.id] ?? 0, submissionResult.score, submissionResult.score);
        setProgress('dailyScore', prevScore?.progress?.[exercise.id] ?? 0, submissionResult.score, submissionResult.score, dateDayDiff(submissionDate, 1));
        setProgress('weeklyScore', prevScore?.progress?.[exercise.id] ?? 0, submissionResult.score, submissionResult.score, dateDayDiff(submissionDate, 7));
        setProgress('monthlyScore', prevScore?.progress?.[exercise.id] ?? 0, submissionResult.score, submissionResult.score, dateDayDiff(submissionDate, 30));
        setProgress('solved', prevSolved?.progress?.[exercise.id] === 'Solved' ? 1 : 0, submissionResult.status === 'Solved' ? 1 : 0, submissionResult.status);
        /* eslint-enable max-len, @typescript-eslint/explicit-module-boundary-types */

        transaction.set(db.userProgress(course.id, submissionResult.userId), {
            userDisplayName: submissionResult.userDisplayName,
            userImageUrl: submissionResult.userImageUrl,
        }, {merge: true});
    });
};

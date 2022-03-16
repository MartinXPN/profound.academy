import {firestore} from 'firebase-admin';
import firebase from 'firebase';
import * as functions from 'firebase-functions';
import * as moment from 'moment';
import {db} from './db';
import {SubmissionResult} from '../models/submissions';
import {Course} from '../models/courses';
import {Exercise} from '../models/exercise';
import {User} from '../models/users';
import {recordInsights} from './insights';
import {updateUserMetric} from './metrics';


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
    if (submission.status !== 'Solved') {
        functions.logger.info(`Not updating user activity. Status: ${submission.status}`);
        return;
    }

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
    if (!user) {
        functions.logger.info(`No user to unlock content. Submission: ${submission.id}`);
        return;
    }
    if (submission.status !== 'Solved') {
        functions.logger.info(`Not unlocking content. Status: ${submission.status}`);
        return;
    }
    if (!exercise.unlockContent || exercise.unlockContent.length === 0) {
        functions.logger.info(`Exercise ${exercise.id} does not have content to unlock`);
        return;
    }

    const isIn = (courseId: string, courses?: Course[]) => courses && courses
        .filter((c) => c.id === courseId).length > 0;

    const unlockedCourses = exercise.unlockContent
        .filter((courseId) => !isIn(courseId, user.courses) && !isIn(courseId, user.completed))
        .map((courseId) => db.course(courseId));
    functions.logger.info(`There are ${unlockedCourses.length} courses to unlock!`);

    if (unlockedCourses.length === 0)
        return;

    if (user.courses && user.courses.length > 0) {
        functions.logger.info('Adding course to pre-existing list of courses');
        transaction.update(db.user(user.id), {
            courses: firebase.firestore.FieldValue.arrayUnion(unlockedCourses),
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
    judgeResult: SubmissionResult,
    userId: string,
    submissionId: string,
): Promise<void> => {
    functions.logger.info(`res for user ${userId}, submission ${submissionId}: ${JSON.stringify(judgeResult)}`);
    const submission = (await db.submissionQueue(userId).doc(submissionId).get()).data();
    const {code, ...submissionResult} = {...submission, ...judgeResult, id: submissionId, isBest: false};
    functions.logger.info(`submissionResult: ${JSON.stringify(submissionResult)}`);
    const submissionDate = submissionResult.createdAt.toDate();

    if (!judgeResult)
        throw Error('Submission result is null');

    if (submissionResult.isTestRun) {
        // save the results to /runs/userId/private/<submissionId>
        functions.logger.info(`Updating the run: ${submissionResult.id} with ${JSON.stringify(submissionResult)}`);
        await firestore().runTransaction(async (transaction) => {
            transaction.set(db.run(userId, submissionResult.id), submissionResult);
            const [courseId, exerciseId] = [submissionResult.course.id, submissionResult.exercise.id];
            recordInsights(transaction, 'runs', courseId, exerciseId, submissionDate);
        });
        return;
    }
    const [courseSnapshot, exerciseSnapshot, userSnapshot] = await Promise.all([
        db.course(submissionResult.course.id).get(),
        db.exercise(submissionResult.course.id, submissionResult.exercise.id).get(),
        db.user(submissionResult.userId).get(),
    ]);
    const course = courseSnapshot.data();
    const exercise = exerciseSnapshot.data();
    const user = userSnapshot.data();
    if (!course)
        throw Error(`Course with id ${submissionResult.course.id} does not exist`);
    if (!exercise)
        throw Error(`Exercise with id ${submissionResult.exercise.id} does not exist`);

    functions.logger.info(`Setting the score to exerciseScore instead of judgeScore (${submissionResult.score})...`);
    submissionResult.score = submissionResult.score / 100.0 * (exercise.score ?? 100);
    functions.logger.info(`Exercise score is set to: ${submissionResult.score}`);

    const status = typeof submissionResult.status === 'string' ? submissionResult.status :
        submissionResult.status.reduce((prev, cur) => cur === 'Solved' ? prev : cur, 'Solved');
    const level = Math.trunc(exercise.order).toString();
    const displayName = submissionResult.userDisplayName ?? user?.displayName;
    const imageUrl = user?.imageUrl ?? '';
    submissionResult.userDisplayName = displayName;
    submissionResult.userImageUrl = imageUrl;
    submissionResult.courseTitle = course.title;
    submissionResult.exerciseTitle = exercise.title;


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
        transaction.set(db.submissionSensitiveRecords(submissionResult.userId, submissionResult.id), sensitiveData);
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
            updateUserMetric(transaction, 'score', submissionResult.userId, course.id, exercise.id, level,
                prevScore?.progress?.[exercise.id] ?? 0, submissionResult.score, submissionResult.score);
            // update weekly score metrics
            const weekly = moment(submissionDate).format('YYYY_MM_WW');
            functions.logger.info(`weekly score path: ${weekly}`);
            updateUserMetric(transaction, `score_${weekly}`,
                submissionResult.userId, course.id, exercise.id, level,
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
        transaction.set(db.userProgress(course.id, submissionResult.userId), {
            userDisplayName: displayName,
            userImageUrl: imageUrl,
        }, {merge: true});
    });
};

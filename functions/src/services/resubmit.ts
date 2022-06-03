import * as functions from 'firebase-functions';
import {firestore} from 'firebase-admin';

import {db} from './db';
import {updateUserProgress} from './metrics';


export const resubmitSolutions = async (courseId: string, exerciseId: string): Promise<void> => {
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
            /* eslint-disable max-len */
            return Promise.all([
                user,
                (await transaction.get(db.userProgress(courseId, user).collection('exerciseSolved').doc(level))).data(),
                (await transaction.get(db.userProgress(courseId, user).collection('exerciseScore').doc(level))).data(),
                (await transaction.get(db.userProgress(courseId, user).collection('exerciseDailyScore').doc(level))).data(),
                (await transaction.get(db.userProgress(courseId, user).collection('exerciseWeeklyScore').doc(level))).data(),
                (await transaction.get(db.userProgress(courseId, user).collection('exerciseMonthlyScore').doc(level))).data(),
                (await transaction.get(db.userProgress(courseId, user).collection('exerciseUpsolveScore').doc(level))).data(),
                (await transaction.get(db.userProgress(courseId, user).collection('exerciseDailyUpsolveScore').doc(level))).data(),
                (await transaction.get(db.userProgress(courseId, user).collection('exerciseWeeklyUpsolveScore').doc(level))).data(),
                (await transaction.get(db.userProgress(courseId, user).collection('exerciseMonthlyUpsolveScore').doc(level))).data(),
                (await transaction.get(db.userProgress(courseId, user).collection('exerciseAttempts').doc(level))).data(),
            ]);
            /* eslint-enable max-len */
        }));

        // reset user progress metrics
        await Promise.all(prevData.map(async (data) => {
            if (!data)
                return;
            const [user, prevSolved,
                prevScore, prevDaily, prevWeekly, prevMonthly,
                upsolveScore, upsolveDaily, upsolveWeekly, upsolveMonthly,
                prevAttempts] = data;
            console.log('user:', user);  // , 'prevSolved:', prevSolved, 'upsolve:', upsolveScore

            const reset = (metric: string, prevValue: number) => updateUserProgress(
                transaction, metric,
                user, courseId, exerciseId, level,
                prevValue, 0, 0, true
            );
            reset('solved', prevSolved?.progress?.[exerciseId] === 'Solved' ? 1 : 0);
            reset('score', prevScore?.progress?.[exerciseId] ?? 0);
            reset('dailyScore', prevDaily?.progress?.[exerciseId] ?? 0);
            reset('weeklyScore', prevWeekly?.progress?.[exerciseId] ?? 0);
            reset('monthlyScore', prevMonthly?.progress?.[exerciseId] ?? 0);
            reset('upsolveScore', upsolveScore?.progress?.[exerciseId] ?? 0);
            reset('upsolveDailyScore', upsolveDaily?.progress?.[exerciseId] ?? 0);
            reset('upsolveWeeklyScore', upsolveWeekly?.progress?.[exerciseId] ?? 0);
            reset('upsolveMonthlyScore', upsolveMonthly?.progress?.[exerciseId] ?? 0);
            reset('attempts', prevAttempts?.progress?.[exerciseId] ?? 0);
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

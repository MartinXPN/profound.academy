import * as admin from 'firebase-admin';
import * as sinon from 'sinon';
import * as chai from 'chai';
import {firestore} from 'firebase-admin';
import {config} from './testConfig';
import {JudgeResult, Submission} from "../src/models/submissions";

const assert = chai.assert;


describe('Re-Evaluate Submissions', function () {
    // Firebase connection can take long to be established
    this.timeout(15000);

    let submissionResults: typeof import('../src/services/submissionResults');
    let resubmit: typeof import('../src/services/resubmit');
    let db: typeof import('../src/services/db').db;
    let adminInitStub: sinon.SinonStub;
    let firestoreStub: sinon.SinonStub;
    let courseId: string;
    let exerciseId: string;
    let userId: string;

    beforeEach(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => firestore(app));
        resubmit = await import('../src/services/resubmit');
        submissionResults = await import('../src/services/submissionResults');
        db = (await import('../src/services/db')).db;

        courseId = db.courses.doc().id;
        exerciseId = db.exercises(courseId).doc().id;
        userId = (await admin.auth().createUser({
            displayName: 'Student Student',
            email: 'student@gmail.com',
            password: 'student132',
        })).uid;
        await db.user(userId).set({
            id: userId,
            displayName: 'Student Student',
        });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await db.course(courseId).set({
            id: courseId,
            img: 'https://i.imgur.com/Mcvgbvm.jpeg',
            revealsAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
            freezeAt: admin.firestore.Timestamp.fromDate(tomorrow),
            visibility: 'private',
            rankingVisibility: 'private',
            allowViewingSolutions: false,
            title: 'Test Course for processing results',
            author: 'Test Framework',
            instructors: [],
            introduction: '',
            levelExercises: {'1': 3, '2': 2},
            levelScores: {'1': 300, '2': 150},
            exercises: [],
        });

        await db.exercise(courseId, exerciseId).set({
            id: exerciseId,
            title: 'Test Exercise for results',
            pageId: '',
            order: 1.14,
            testCases: [],
            exerciseType: 'textAnswer',
        });
    });

    afterEach(async () => {
        await firestore().recursiveDelete(db.exercise(courseId, exerciseId));
        await firestore().recursiveDelete(db.course(courseId));
        await firestore().recursiveDelete(db.updateQueue);
        await firestore().recursiveDelete(db.submissionResults);
        await firestore().recursiveDelete(db.submissionQueue(userId));
        await admin.firestore().recursiveDelete(db.user(userId));
        await admin.auth().deleteUser(userId);
        firestoreStub.restore();
        adminInitStub.restore();
    });

    describe('Re-evaluate for a single user', () => {
        it('Should reset all the metrics', async () => {
            const submission = {
                id: '',
                userId: userId,
                course: db.course(courseId), exercise: db.exercise(courseId, exerciseId),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                code: {'main.py': 'print("hello hello")'},
                language: 'python',
                isTestRun: false,
            };
            const submissionDoc = await db.submissionQueue(userId).add(submission as unknown as Submission);
            const judgeResult = {
                overall: {status: 'Wrong answer', score: 80, memory: 52, time: 0.1, returnCode: 0},
                compileResult: {status: 'Solved', score: 0, memory: 100, time: 1, returnCode: 0},
            } as JudgeResult;

            await submissionResults.processResult(judgeResult, userId, submissionDoc.id);
            await resubmit.resubmitSolutions(courseId, exerciseId);

            const userExerciseProgress = (await db.userProgress(courseId, userId).collection('exerciseScore').doc('1').get()).data();
            assert.equal(userExerciseProgress?.['progress']?.[exerciseId] ?? 0, 0, `Regular score should reset to 0: ${JSON.stringify(userExerciseProgress)}`);

            const userProgress = (await db.userProgress(courseId, userId).get()).data() as any;
            assert.equal(userProgress?.['score'], 0, `Score should should be reset to 0: ${JSON.stringify(userProgress)}`);
            assert.equal(userProgress?.['dailyScore'], 0, `Daily score should should be reset to 0: ${JSON.stringify(userProgress)}`);
            assert.equal(userProgress?.['weeklyScore'], 0, `Weekly score should should be reset to 0: ${JSON.stringify(userProgress)}`);
            assert.equal(userProgress?.['monthlyScore'], 0, `Monthly score should should be reset to 0: ${JSON.stringify(userProgress)}`);
            assert.equal(userProgress?.['levelScore']?.['1'], 0, `Level score should be reset to 0: ${JSON.stringify(userProgress)}`);
            assert.equal(userProgress?.['levelDailyScore']?.['1'], 0, `Level daily score should be reset to 0: ${JSON.stringify(userProgress)}`);
            assert.equal(userProgress?.['levelWeeklyScore']?.['1'], 0, `Level weekly score should be reset to 0: ${JSON.stringify(userProgress)}`);
            assert.equal(userProgress?.['levelMonthlyScore']?.['1'], 0, `Level monthly score should be reset to 0: ${JSON.stringify(userProgress)}`);
        });
    });

    describe('Re-evaluate for an exercise', () => {
        it('Should reset exercise insights', async () => {
            const submission = {
                id: '',
                userId: userId,
                course: db.course(courseId), exercise: db.exercise(courseId, exerciseId),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                code: {'main.py': 'print("hello hello")'},
                language: 'python',
                isTestRun: false,
            };
            const submissionDoc = await db.submissionQueue(userId).add(submission as unknown as Submission);
            const judgeResult = {
                overall: {status: 'Solved', score: 100, memory: 52, time: 0.1, returnCode: 0},
                compileResult: {status: 'Solved', score: 0, memory: 100, time: 1, returnCode: 0},
            } as JudgeResult;

            await submissionResults.processResult(judgeResult, userId, submissionDoc.id);
            await resubmit.resubmitSolutions(courseId, exerciseId);

            const courseInsights = (await db.courseOverallInsights(courseId).get()).data();
            console.log('courseInsights', courseInsights);
            assert.equal(courseInsights?.submissions, 0);
            assert.equal(courseInsights?.solved, 0);
            assert.equal(courseInsights?.runs ?? 0, 0);
            assert.equal(courseInsights?.totalScore, 0);

            const exerciseInsights = (await db.exerciseInsights(courseId, exerciseId).get()).data();
            console.log('exerciseInsights', exerciseInsights);
            assert.equal(exerciseInsights?.submissions, 0);
            assert.equal(exerciseInsights?.solved, 0);
            assert.equal(exerciseInsights?.runs ?? 0, 0);
            assert.equal(exerciseInsights?.totalScore, 0);
        });
    });
});

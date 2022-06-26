import * as admin from 'firebase-admin';
import * as sinon from 'sinon';
import * as chai from 'chai';
import {config} from './testConfig';
import {JudgeResult, Submission} from "../src/models/submissions";

const assert = chai.assert;


describe('Submit a solution', function () {
    // Firebase connection can take long to be established
    this.timeout(5000);

    let submissions: typeof import('../src/services/submissions');
    let db: typeof import('../src/services/db').db;
    let adminInitStub: sinon.SinonStub;
    let firestoreStub: sinon.SinonStub;
    let submissionResultStub: sinon.SinonStub;
    let courseId: string;
    let exerciseId: string;
    let userId: string;

    beforeEach(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => admin.firestore(app));
        submissions = await import('../src/services/submissions');
        db = (await import('../src/services/db')).db;
        const submissionResults = await import ('../src/services/submissionResults');
        submissionResultStub = sinon.stub(submissionResults, 'processResult');
        courseId = db.courses.doc().id;
        exerciseId = db.exercises(courseId).doc().id;
        userId = (await admin.auth().createUser({
            displayName: 'Student Student',
            email: 'student@gmail.com',
            password: 'student132',
        })).uid;

        await db.course(courseId).set({
            id: courseId,
            img: 'https://i.imgur.com/Mcvgbvm.jpeg',
            revealsAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
            freezeAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
            visibility: 'private',
            rankingVisibility: 'private',
            allowViewingSolutions: false,
            title: 'Test Course',
            author: 'Test Framework',
            instructors: [],
            introduction: '',
            levels: [{id: '1', title: 'Level 1'}],
            levelExercises: {},
            levelScores: {},
            exercises: [],
        });

        await db.exercise(courseId, exerciseId).set({
            id: exerciseId,
            title: 'Test Exercise',
            pageId: '',
            levelId: '1',
            order: 1.14,
            testCases: [],
            exerciseType: 'textAnswer',
        });

        await db.exercisePrivateFields(courseId, exerciseId).set({
            id: '',
            answer: 'hello hello',
        });
    });

    afterEach(async () => {
        await admin.firestore().recursiveDelete(db.course(courseId));
        await admin.firestore().recursiveDelete(db.user(userId));
        await admin.firestore().recursiveDelete(admin.firestore().collection('submissionQueue'));
        await admin.firestore().recursiveDelete(admin.firestore().collection('submissions'));
        await admin.auth().deleteUser(userId);
        firestoreStub.restore();
        adminInitStub.restore();
        submissionResultStub.restore();
    });

    describe('Submit a regular exercise (multiple choice, text answer, etc)', () => {
        it('Should submit properly', async () => {
            const submission = {
                id: '',
                userId: userId,
                course: db.course(courseId), exercise: db.exercise(courseId, exerciseId),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                code: {'main.txt': 'hello hello'},
                language: 'txt',
                isTestRun: false,
            };
            const submissionDoc = await db.submissionQueue(userId).add(submission as unknown as Submission);
            await submissions.submit((await submissionDoc.get()).data() as unknown as Submission);
            const processResultCall = submissionResultStub.getCall(0).args[0] as JudgeResult;
            assert.equal(processResultCall.overall.status, 'Solved');
            assert.equal(processResultCall.overall.score, 100);

            const submissionResult = (await db.submissionResult(submissionDoc.id).get()).data();
            assert.equal(submissionResult?.status, 'Checking', 'Make sure the result is in the processing stage');
            assert.equal(submissionResult?.score, 0, 'Make sure the result is in the processing stage');
        });
    });

    describe('Submit code', () => {
        it('Should submit to LambdaJudge', async () => {
            const submission = {
                id: '',
                userId: userId,
                course: db.course(courseId), exercise: db.exercise(courseId, exerciseId),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                code: {'main.py': 'print("hello hello")'},
                testCases: [{'input': '', 'target': 'hello hello'}],
                language: 'python',
                isTestRun: true,
            };
            await db.exercise(courseId, exerciseId).set({
                testCases: [{'input': '', 'target': 'hello hello'}],
                exerciseType: 'code',
            }, {merge: true});

            const submissionDoc = await db.submissionQueue(userId).add(submission as unknown as Submission);
            await submissions.submit((await submissionDoc.get()).data() as unknown as Submission);
            const processResultCall = submissionResultStub.getCall(0).args[0] as JudgeResult;
            assert.equal(processResultCall.overall.status, 'Solved');
            assert.equal(processResultCall.overall.score, 100);
        });

        it('Should result in Wrong Answer', async () => {
            const submission = {
                id: '',
                userId: userId,
                course: db.course(courseId), exercise: db.exercise(courseId, exerciseId),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                code: {'main.py': 'print("hello yo")'},
                testCases: [{'input': '', 'target': 'hello hello'}],
                language: 'python',
                isTestRun: true,
            };
            await db.exercise(courseId, exerciseId).set({
                testCases: [{'input': '', 'target': 'hello hello'}],
                exerciseType: 'code',
            }, {merge: true});

            const submissionDoc = await db.submissionQueue(userId).add(submission as unknown as Submission);
            await submissions.submit((await submissionDoc.get()).data() as unknown as Submission);
            const processResultCall = submissionResultStub.getCall(0).args[0] as JudgeResult;
            assert.equal(processResultCall.overall.status, 'Wrong answer');
            assert.equal(processResultCall.overall.score, 0);
        });
    });

    describe('Test allowed attempts', () => {
        it('Should restrict when reaching the number of allowed attempts', async () => {
            const submission = {
                id: '',
                userId: userId,
                course: db.course(courseId), exercise: db.exercise(courseId, exerciseId),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                code: {'main.txt': 'hello'},
                language: 'txt',
                isTestRun: false,
            };
            await db.exercise(courseId, exerciseId).set({
                allowedAttempts: 2,
            }, {merge: true});

            const submissionDoc = await db.submissionQueue(userId).add(submission as unknown as Submission);
            await submissions.submit((await submissionDoc.get()).data() as unknown as Submission);
            const processResultCall = submissionResultStub.getCall(0).args[0] as JudgeResult;
            assert.equal(processResultCall.overall.status, 'Wrong answer');
            assert.equal(processResultCall.overall.score, 0);

            const secondDoc = await db.submissionQueue(userId).add(submission as unknown as Submission);
            await submissions.submit((await secondDoc.get()).data() as unknown as Submission);
            const secondProcessResultCall = submissionResultStub.getCall(0).args[0] as JudgeResult;
            assert.equal(secondProcessResultCall.overall.status, 'Wrong answer');
            assert.equal(secondProcessResultCall.overall.score, 0);

            const thirdDoc = await db.submissionQueue(userId).add(submission as unknown as Submission);
            await submissions.submit((await thirdDoc.get()).data() as unknown as Submission);
            const thirdResult = (await db.submissionResult(thirdDoc.id).get()).data();
            assert.equal(thirdResult?.status, 'Unavailable');
            chai.expect(thirdResult?.message ?? '').to.contain('Exceeded the number of allowed attempts');
        });
    });
});

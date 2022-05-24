import * as admin from 'firebase-admin';
import * as sinon from 'sinon';
import * as chai from 'chai';
import {config} from './testConfig';
import {JudgeResult, Submission} from '../src/models/submissions';

const assert = chai.assert;


describe('Process submission result', function () {
    // Firebase connection can take long to be established
    this.timeout(20000);

    let submissionResults: typeof import('../src/services/submissionResults');
    let db: typeof import('../src/services/db').db;
    let adminInitStub: sinon.SinonStub;
    let firestoreStub: sinon.SinonStub;
    let courseId: string;
    let exerciseId: string;
    let userId: string;

    beforeEach(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => admin.firestore(app));
        submissionResults = await import ('../src/services/submissionResults');
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
        await admin.firestore().recursiveDelete(db.user(userId));
        await admin.firestore().recursiveDelete(admin.firestore().collection('courses'));
        await admin.firestore().recursiveDelete(admin.firestore().collection('submissionQueue'));
        await admin.firestore().recursiveDelete(admin.firestore().collection('submissions'));
        await admin.auth().deleteUser(userId);
        firestoreStub.restore();
        adminInitStub.restore();
    });

    describe('Proper submission', () => {
        it('Should process fine', async () => {
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
                testResults: [
                    {status: 'Solved', score: 20, memory: 40, time: 0.1, returnCode: 0},
                    {status: 'Solved', score: 20, memory: 52, time: 0.1, returnCode: 0},
                    {status: 'Solved', score: 20, memory: 20, time: 0.01, returnCode: 0},
                    {status: 'Solved', score: 20, memory: 40, time: 0.1, returnCode: 0},
                    {status: 'Wrong answer', score: 0, memory: 40, time: 0.1, returnCode: 0},
                ]
            } as JudgeResult;

            await submissionResults.processResult(judgeResult, userId, submissionDoc.id);
            let wrongResult = (await db.submissionResult(submissionDoc.id).get()).data();
            assert.equal(wrongResult?.status, 'Wrong answer');
            assert.isUndefined(wrongResult?.code, 'Make sure we do not expose the source code');
            assert.isTrue(wrongResult?.isBest, 'The only submission is the best submission');

            const correct = {
                ...judgeResult,
                overall: {status: 'Solved', score: 100, memory: 52, time: 0.1, returnCode: 0},
                testResults: [
                    {status: 'Solved', score: 20, memory: 40, time: 0.1, returnCode: 0},
                    {status: 'Solved', score: 20, memory: 52, time: 0.1, returnCode: 0},
                    {status: 'Solved', score: 20, memory: 20, time: 0.01, returnCode: 0},
                    {status: 'Solved', score: 20, memory: 40, time: 0.1, returnCode: 0},
                    {status: 'Solved', score: 20, memory: 40, time: 0.1, returnCode: 0},
                ]
            } as JudgeResult;
            const correctDoc = await db.submissionQueue(userId).add(submission as unknown as Submission);
            await submissionResults.processResult(correct, userId, correctDoc.id);
            let correctResult = (await db.submissionResult(correctDoc.id).get()).data();
            wrongResult = (await db.submissionResult(submissionDoc.id).get()).data();
            assert.equal(correctResult?.status, 'Solved');
            assert.isUndefined(correctResult?.code, 'Make sure we do not expose the source code');
            assert.isTrue(correctResult?.isBest, 'Should make the latest submission the current best');
            assert.isFalse(wrongResult?.isBest, 'Should update the previous best');

            const same = {...correct};
            const sameDoc = await db.submissionQueue(userId).add(submission as unknown as Submission);
            await submissionResults.processResult(same, userId, sameDoc.id);
            wrongResult = (await db.submissionResult(submissionDoc.id).get()).data();
            correctResult = (await db.submissionResult(correctDoc.id).get()).data();
            let sameResult = (await db.submissionResult(sameDoc.id).get()).data();
            assert.equal(correctResult?.status, 'Solved');
            assert.equal(sameResult?.status, 'Solved');
            assert.isUndefined(sameResult?.code, 'Make sure we do not expose the source code');
            assert.isTrue(correctResult?.isBest, 'Should not change the best');
            assert.isFalse(sameResult?.isBest, 'Should not change the best');
            assert.isFalse(wrongResult?.isBest, 'Should not change the best');
        });
    });

    describe('Multiple choice question', () => {
        it('Should process fine', async () => {
            const submission = {
                id: '',
                userId: userId,
                course: db.course(courseId), exercise: db.exercise(courseId, exerciseId),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                code: {'main.txt': 'hello hello'},
                language: 'text',
                isTestRun: false,
            };
            const submissionDoc = await db.submissionQueue(userId).add(submission as unknown as Submission);
            const judgeResult = {
                overall: {status: 'Wrong answer', score: 0, memory: 0, time: 0, returnCode: 0},
            } as JudgeResult;
            await db.exercise(courseId, exerciseId).set({exerciseType: 'multipleChoice'}, {merge: true});

            await submissionResults.processResult(judgeResult, userId, submissionDoc.id);
            let wrongResult = (await db.submissionResult(submissionDoc.id).get()).data();
            assert.equal(wrongResult?.status, 'Wrong answer');
            assert.isUndefined(wrongResult?.code, 'Make sure we do not expose the answer');

            const correct = {
                overall: {status: 'Solved', score: 100, memory: 0, time: 0, returnCode: 0},
            } as JudgeResult;
            const correctDoc = await db.submissionQueue(userId).add(submission as unknown as Submission);
            await submissionResults.processResult(correct, userId, correctDoc.id);
            let correctResult = (await db.submissionResult(correctDoc.id).get()).data();
            wrongResult = (await db.submissionResult(submissionDoc.id).get()).data();
            assert.equal(correctResult?.status, 'Solved');
            assert.isUndefined(correctResult?.code, 'Make sure we do not expose the answer');
            assert.isTrue(correctResult?.isBest, 'Should make the latest submission the current best');
            assert.isFalse(wrongResult?.isBest, 'Should update the previous best');
        });
    });

    describe('Late submission', () => {
        it('Should update the upsolving metrics', async () => {
            const creationDate = new Date();
            creationDate.setDate(creationDate.getDate() + 3);
            const submission = {
                id: '',
                userId: userId,
                course: db.course(courseId), exercise: db.exercise(courseId, exerciseId),
                createdAt: admin.firestore.Timestamp.fromDate(creationDate),
                code: {'main.py': 'print("hello hello")'},
                language: 'python',
                isTestRun: false,
            };
            const submissionDoc = await db.submissionQueue(userId).add(submission as unknown as Submission);
            const judgeResult = {
                overall: {status: 'Wrong answer', score: 80, memory: 52, time: 0.1, returnCode: 0},
                compileResult: {status: 'Solved', score: 0, memory: 100, time: 1, returnCode: 0},
                testResults: [
                    {status: 'Solved', score: 20, memory: 40, time: 0.1, returnCode: 0},
                    {status: 'Solved', score: 20, memory: 52, time: 0.1, returnCode: 0},
                    {status: 'Solved', score: 20, memory: 20, time: 0.01, returnCode: 0},
                    {status: 'Solved', score: 20, memory: 40, time: 0.1, returnCode: 0},
                    {status: 'Wrong answer', score: 0, memory: 40, time: 0.1, returnCode: 0},
                ]
            } as JudgeResult;

            await submissionResults.processResult(judgeResult, userId, submissionDoc.id);
            const userUpsovingExerciseProgress = (await db.userProgress(courseId, userId).collection('exerciseUpsolveScore').doc('1').get()).data();
            const userExerciseProgress = (await db.userProgress(courseId, userId).collection('exerciseScore').doc('1').get()).data();
            assert.equal(userUpsovingExerciseProgress?.['progress']?.[exerciseId], 80, `Upsolve score should be updated: ${JSON.stringify(userUpsovingExerciseProgress)}`);
            assert.equal(userExerciseProgress?.['progress']?.[exerciseId] ?? 0, 0, `Regular score should not be updated: ${JSON.stringify(userExerciseProgress)}`);

            const userProgress = (await db.userProgress(courseId, userId).get()).data();
            assert.equal(userProgress?.upsolveScore, 80, `Upsolve score should be updated for course: ${JSON.stringify(userProgress)}`);
            assert.equal(userProgress?.levelUpsolveScore?.['1'], 80, `Upsolve score should be updated for level: ${JSON.stringify(userProgress)}`);
        });
    });

    describe('Unlock side quests', () => {
        it('Should unlock a side quest', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const questDoc = await db.courses.add({
                id: courseId,
                img: 'https://i.imgur.com/Mcvgbvm.jpeg',
                revealsAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
                freezeAt: admin.firestore.Timestamp.fromDate(tomorrow),
                visibility: 'private',
                rankingVisibility: 'private',
                allowViewingSolutions: false,
                title: 'Test Side Quest',
                author: 'Test Framework',
                instructors: [],
                introduction: '',
                levelExercises: {'1': 4},
                levelScores: {'1': 400},
                exercises: [],
            });
            await db.exercise(courseId, exerciseId).update({unlockContent: [questDoc.id]});

            const creationDate = new Date();
            creationDate.setDate(creationDate.getDate() + 3);
            const submission = {
                id: '',
                userId: userId,
                course: db.course(courseId), exercise: db.exercise(courseId, exerciseId),
                createdAt: admin.firestore.Timestamp.fromDate(creationDate),
                code: {'main.py': 'print("hello hello")'},
                language: 'python',
                isTestRun: false,
            };
            const submissionDoc = await db.submissionQueue(userId).add(submission as unknown as Submission);
            const judgeResult = {
                overall: {status: 'Solved', score: 100, memory: 52, time: 0.1, returnCode: 0},
                compileResult: {status: 'Solved', score: 0, memory: 100, time: 1, returnCode: 0},
                testResults: [
                    {status: 'Solved', score: 50, memory: 40, time: 0.1, returnCode: 0},
                    {status: 'Solved', score: 50, memory: 52, time: 0.1, returnCode: 0},
                ]
            } as JudgeResult;

            await submissionResults.processResult(judgeResult, userId, submissionDoc.id);
            let userData = (await db.user(userId).get()).data();
            let submissionResult = (await db.submissionResult(submissionDoc.id).get()).data();
            chai.expect(submissionResult?.message).to.have.string('Congratulations!', 'Should congratulate for unlocking');
            assert.isNotEmpty(userData?.courses?.filter((c) => (c.id === questDoc.id)), `The user should have the course now ${JSON.stringify(userData?.courses)}`);

            const questPrivateFields = (await db.coursePrivateFields(questDoc.id).get()).data();
            chai.expect(questPrivateFields?.invitedUsers ?? []).to.include(userId, `The user should be invited now ${JSON.stringify(questPrivateFields)}`);
        });
    });
});

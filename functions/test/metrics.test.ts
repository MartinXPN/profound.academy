import * as admin from 'firebase-admin';
import * as sinon from 'sinon';
import * as chai from 'chai';
import {config} from "./testConfig";
import {format} from "../src/services/metrics";
import {dateDayDiff} from "../src/services/util";

const assert = chai.assert;


describe('Record Insights', function () {
    // Firebase connection can take long to be established
    this.timeout(5000);

    let metrics: typeof import('../src/services/metrics');
    let db: typeof import('../src/services/db').db;
    let adminInitStub: sinon.SinonStub;
    let firestoreStub: sinon.SinonStub;
    let courseId: string;

    beforeEach(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => admin.firestore(app));
        metrics = await import('../src/services/metrics');
        db = (await import('../src/services/db')).db;
        courseId = db.courses.doc().id;
    });

    afterEach(async () => {
        firestoreStub.restore();
        adminInitStub.restore();
        await admin.firestore().recursiveDelete(db.course(courseId));
    });

    describe('Insight for a single course', () => {
        it('Different exercises should have different counts', async () => {
            await admin.firestore().runTransaction(async (transaction) => {
                metrics.recordInsights(transaction, 'runs', courseId, 'exercise1', new Date());
                metrics.recordInsights(transaction, 'runs', courseId, 'exercise1', new Date());
                metrics.recordInsights(transaction, 'runs', courseId, 'exercise2', new Date());
            });

            const courseOverall = (await db.courseOverallInsights(courseId).get()).data();
            assert.equal(courseOverall?.runs, 3, 'Keep track of overall course metrics');

            const exercise1Overall = (await db.exerciseInsights(courseId, 'exercise1').get()).data();
            assert.equal(exercise1Overall?.runs, 2, 'Keep track of overall exercise metrics');

            const exercise2Overall = (await db.exerciseInsights(courseId, 'exercise2').get()).data();
            assert.equal(exercise2Overall?.runs, 1, 'Exercise 2 should have only 1 value saved');
        });
    });
});


describe('Record New User Insights', function () {
    // Firebase connection can take long to be established
    this.timeout(5000);

    let metrics: typeof import('../src/services/metrics');
    let db: typeof import('../src/services/db').db;
    let adminInitStub: sinon.SinonStub;
    let firestoreStub: sinon.SinonStub;
    let course1Id: string;
    let course2Id: string;
    let user1Id: string;
    let user2Id: string;

    beforeEach(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => admin.firestore(app));
        metrics = await import('../src/services/metrics');
        db = (await import('../src/services/db')).db;
        course1Id = db.courses.doc().id;
        course2Id = db.courses.doc().id;
        user1Id = db.users.doc().id;
        user2Id = db.users.doc().id;
    });

    afterEach(async () => {
        await admin.firestore().recursiveDelete(db.course(course1Id));
        await admin.firestore().recursiveDelete(db.course(course2Id));
        await admin.firestore().recursiveDelete(db.user(user1Id));
        await admin.firestore().recursiveDelete(db.user(user2Id));
        firestoreStub.restore();
        adminInitStub.restore();
    });

    describe('New user new course', () => {
        it('Single user single course', async () => {
            const date = new Date();
            await db.user(user1Id).set({'id': user1Id, 'displayName': 'Bob'});

            await admin.firestore().runTransaction(async (transaction) => {
                await metrics.recordNewUserInsight(transaction, user1Id, course1Id, date);
            });

            const userData = (await db.user(user1Id).get()).data();
            assert.equal(userData?.displayName, 'Bob', 'Initial data should be preserved');
            assert.equal(userData?.courses?.length, 1, 'Should add the course to the list');

            const insightDay = format(date);
            const courseInsights = (await db.courseInsights(course1Id).doc(insightDay).get()).data();
            const courseOverall = (await db.courseOverallInsights(course1Id).get()).data();

            assert.equal(courseInsights?.users, 1, 'Keep track of overall users');
            assert.equal(courseOverall?.users, 1, 'Keep track of overall users');
        });
    });

    describe('New users for multiple courses',  () => {
        it('Multiple courses', async () => {
            const date = new Date();
            await db.user(user1Id).set({'id': user1Id, 'displayName': 'Bob'});
            await db.user(user2Id).set({'id': user1Id, 'displayName': 'Alice'});

            await admin.firestore().runTransaction(async (transaction) => {
                await metrics.recordNewUserInsight(transaction, user1Id, course1Id, date);
            });
            await admin.firestore().runTransaction(async (transaction) => {
                await metrics.recordNewUserInsight(transaction, user2Id, course1Id, date);
            });

            const user1Data = (await db.user(user1Id).get()).data();
            let user2Data = (await db.user(user2Id).get()).data();
            assert.equal(user1Data?.courses?.length, 1, 'Should add the course to the user1 list');
            assert.equal(user2Data?.courses?.length, 1, 'Should add the course to the user2 list');

            const insightDay = format(date);
            const course1Insights = (await db.courseInsights(course1Id).doc(insightDay).get()).data();
            const course1Overall = (await db.courseOverallInsights(course1Id).get()).data();
            assert.equal(course1Insights?.users, 2, `Keep track of overall users ${JSON.stringify(course1Insights)}`);
            assert.equal(course1Overall?.users, 2, `Keep track of overall users ${JSON.stringify(course1Overall)}`);

            // sign user2 up for the course2
            await admin.firestore().runTransaction(async (transaction) => {
                await metrics.recordNewUserInsight(transaction, user2Id, course2Id, date);
            });
            const course2Overall = (await db.courseOverallInsights(course2Id).get()).data();
            assert.equal(course2Overall?.users, 1, `Keep track of overall users ${JSON.stringify(course2Overall)}`);

            user2Data = (await db.user(user2Id).get()).data();
            assert.equal(user2Data?.courses?.length, 2, 'Should add the course to the user2 list');
        });
    });
});


describe('Update User Progress', function () {
    // Firebase connection can take long to be established
    this.timeout(5000);

    let metrics: typeof import('../src/services/metrics');
    let db: typeof import('../src/services/db').db;
    let adminInitStub: sinon.SinonStub;
    let firestoreStub: sinon.SinonStub;
    let userId: string;
    let courseId: string;
    let exercise1Id: string;
    let exercise2Id: string;

    beforeEach(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => admin.firestore(app));
        metrics = await import('../src/services/metrics');
        db = (await import('../src/services/db')).db;
        userId = db.users.doc().id;
        courseId = db.courses.doc().id;
        exercise1Id = db.exercises(courseId).doc().id;
        exercise2Id = db.exercises(courseId).doc().id;
    });

    afterEach(async () => {
        await admin.firestore().recursiveDelete(db.course(courseId));
        await admin.firestore().recursiveDelete(db.user(userId));
        await admin.firestore().recursiveDelete(db.updateQueue);
        firestoreStub.restore();
        adminInitStub.restore();
    });

    describe('User progress for a single exercise', () => {
        it('Correctly update the metric', async () => {
            await admin.firestore().runTransaction(async (transaction) => {
                metrics.updateUserProgress(transaction, 'score', userId, courseId, exercise1Id, 'level1', 0, 10, 10);
            });
            let progress = (await db.userProgress(courseId, userId).get()).data();
            let exerciseProgress = (await db.userProgress(courseId, userId).collection('exerciseScore').doc('level1').get()).data();
            assert.equal(progress?.score, 10, 'Initial score should be tracked');
            assert.equal(exerciseProgress?.['progress']?.[exercise1Id], 10, 'Initial score should be tracked');

            await admin.firestore().runTransaction(async (transaction) => {
                metrics.updateUserProgress(transaction, 'score', userId, courseId, exercise1Id, 'level1', 10, 20, 20);
                metrics.updateUserProgress(transaction, 'score', userId, courseId, exercise2Id, 'level1', 0, 30, 30);
            });
            await admin.firestore().runTransaction(async (transaction) => {
                metrics.updateUserProgress(transaction, 'score', userId, courseId, exercise1Id, 'level1', 20, 10, 20);
            });
            progress = (await db.userProgress(courseId, userId).get()).data();
            exerciseProgress = (await db.userProgress(courseId, userId).collection('exerciseScore').doc('level1').get()).data();
            assert.equal(progress?.score, 50, 'User score should be the sum of all the exercise scores');
            assert.equal(progress?.userId, userId, 'User ID should be added for collection group queries');
            assert.equal(exerciseProgress?.['progress']?.[exercise1Id], 20, 'exercise 1 score should accumulate');
            assert.equal(exerciseProgress?.['progress']?.[exercise2Id], 30, 'exercise 2 score be set');
        });

        it('Force update a metric', async () => {
            await admin.firestore().runTransaction(async (transaction) => {
                metrics.updateUserProgress(transaction, 'score', userId, courseId, exercise1Id, 'level1', 0, 10, 10);
            });
            await admin.firestore().runTransaction(async (transaction) => {
                metrics.updateUserProgress(transaction, 'score', userId, courseId, exercise1Id, 'level1', 10, 5, 5, true);
            });

            let progress = (await db.userProgress(courseId, userId).get()).data();
            let exerciseProgress = (await db.userProgress(courseId, userId).collection('exerciseScore').doc('level1').get()).data();
            assert.equal(progress?.score, 5, 'User score should be down as well');
            assert.equal(exerciseProgress?.['progress']?.[exercise1Id], 5, 'Exercise score should be changed');
        });

        it('Rollback progress after a certain time', async () => {
            await admin.firestore().runTransaction(async (transaction) => {
                metrics.updateUserProgress(transaction, 'score', userId, courseId, exercise1Id, 'level1', 0, 10, 10, false, dateDayDiff(new Date(), 7));
            });
            // Update with the same value should be ignored
            await admin.firestore().runTransaction(async (transaction) => {
                metrics.updateUserProgress(transaction, 'score', userId, courseId, exercise1Id, 'level1', 10, 10, 10, false, dateDayDiff(new Date(), 7));
            });
            await admin.firestore().runTransaction(async (transaction) => {
                metrics.updateUserProgress(transaction, 'score', userId, courseId, exercise1Id, 'level1', 10, 10, 10, true, dateDayDiff(new Date(), 7));
            });

            let progress = (await db.userProgress(courseId, userId).get()).data();
            let exerciseProgress = (await db.userProgress(courseId, userId).collection('exerciseScore').doc('level1').get()).data();
            assert.equal(progress?.score, 10, 'Should record user progress score');
            assert.equal(exerciseProgress?.['progress']?.[exercise1Id], 10, 'Should record exercise score');

            const rollbackData = (await db.updateQueue.get()).docs.map(d => d.data());
            const updateScores = rollbackData.map(d => d.diff);
            assert.deepEqual(updateScores, [-10, -10, -10], 'Should update exercise, level, and course scores in the future');
        });
    });
});

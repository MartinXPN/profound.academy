import * as admin from 'firebase-admin';
import * as sinon from 'sinon';
import * as chai from 'chai';
import {config} from "./testConfig";
import {format} from "../src/services/metrics";

const assert = chai.assert;


describe('Record Insights', function () {
    // Firebase connection can take long to be established
    this.timeout(5000);

    let metrics: typeof import('../src/services/metrics');
    let db: typeof import('../src/services/db').db;
    let adminInitStub: sinon.SinonStub;
    let firestoreStub: sinon.SinonStub;
    let courseId: string;

    before(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => admin.firestore(app));
        metrics = await import('../src/services/metrics');
        db = (await import('../src/services/db')).db;
        courseId = db.courses.doc().id;
    });

    after(async () => {
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
    let userId: string;

    before(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => admin.firestore(app));
        metrics = await import('../src/services/metrics');
        db = (await import('../src/services/db')).db;
        course1Id = db.courses.doc().id;
        course2Id = db.courses.doc().id;
        userId = db.users.doc().id;
    });

    after(async () => {
        firestoreStub.restore();
        adminInitStub.restore();
        await admin.firestore().recursiveDelete(db.course(course1Id));
        await admin.firestore().recursiveDelete(db.course(course2Id));
    });

    describe('New user new course', () => {
        it('Single user single course', async () => {
            const date = new Date();
            await db.user(userId).set({'id': userId, 'displayName': 'Bob'});

            await admin.firestore().runTransaction(async (transaction) => {
                await metrics.recordNewUserInsight(transaction, userId, course1Id, date);
            });

            const userData = (await db.user(userId).get()).data();
            assert.equal(userData?.displayName, 'Bob', 'Initial data should be preserved');
            assert.equal(userData?.courses?.length, 1, 'Should add the course to the list');

            const insightDay = format(date);
            const courseInsights = (await db.courseInsights(course1Id).doc(insightDay).get()).data();
            const courseOverall = (await db.courseOverallInsights(course1Id).get()).data();

            assert.equal(courseInsights?.users, 1, 'Keep track of overall users');
            assert.equal(courseOverall?.users, 1, 'Keep track of overall users');
        });
    });
});

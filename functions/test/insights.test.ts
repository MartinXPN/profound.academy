import * as admin from 'firebase-admin';
import * as sinon from 'sinon';
import * as chai from 'chai';
import {config} from "./testConfig";

const assert = chai.assert;


describe('Record Insights', function () {
    // Firebase connection can take long to be established
    this.timeout(5000);

    let insights: typeof import('../src/services/insights');
    let db: typeof import('../src/services/db').db;
    let adminInitStub: sinon.SinonStub;
    let firestoreStub: sinon.SinonStub;
    let courseId: string;

    before(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => admin.firestore(app));
        insights = await import('../src/services/insights');
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
                insights.recordInsights(transaction, 'runs', courseId, 'exercise1', new Date());
                insights.recordInsights(transaction, 'runs', courseId, 'exercise1', new Date());
                insights.recordInsights(transaction, 'runs', courseId, 'exercise2', new Date());
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

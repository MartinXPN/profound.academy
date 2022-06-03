import * as admin from 'firebase-admin';
import * as sinon from 'sinon';
// import * as chai from 'chai';
import {firestore} from 'firebase-admin';
import {config} from './testConfig';

// const assert = chai.assert;


describe('Re-Evaluate Submissions', function () {
    // Firebase connection can take long to be established
    this.timeout(5000);

    let resubmit: typeof import('../src/services/resubmit');
    let db: typeof import('../src/services/db').db;
    let adminInitStub: sinon.SinonStub;
    let firestoreStub: sinon.SinonStub;
    let courseId: string;
    let exerciseId: string;

    beforeEach(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => firestore(app));
        resubmit = await import('../src/services/resubmit');
        db = (await import('../src/services/db')).db;

        courseId = db.courses.doc().id;
        exerciseId = db.exercises(courseId).doc().id;
    });

    afterEach(async () => {
        firestoreStub.restore();
        adminInitStub.restore();
        await firestore().recursiveDelete(db.exercise(courseId, exerciseId));
        await firestore().recursiveDelete(db.course(courseId));
    });

    describe('Re-evaluate for a single user', () => {
        it('Should reset all the metrics', async () => {
            await resubmit.resubmitSolutions(courseId, exerciseId);
            // const data = (await doc.get()).data();
            //
            // assert.equal(data?.one, 10, 'Should update one: 1 to 10');
            // assert.equal(data?.two?.three?.four, 15, 'Should update nested properties properly');
            // assert.equal(data?.later?.something, 8, 'Should not update docs scheduled for later');
        });
    });
});
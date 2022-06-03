import * as admin from 'firebase-admin';
import * as sinon from 'sinon';
import * as chai from 'chai';
import {firestore} from 'firebase-admin';
import {config} from './testConfig';
import {dateDayDiff} from '../src/services/util';

const assert = chai.assert;


describe('Update Progress', function () {
    // Firebase connection can take long to be established
    this.timeout(5000);

    let updates: typeof import('../src/services/updates');
    let db: typeof import('../src/services/db').db;
    let adminInitStub: sinon.SinonStub;
    let firestoreStub: sinon.SinonStub;
    let doc: firestore.DocumentReference;

    beforeEach(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => admin.firestore(app));
        updates = await import('../src/services/updates');
        db = (await import('../src/services/db')).db;
        
        doc = firestore().collection('random').doc('progress');
        await doc.set({
            one: 1,
            two: {three: {four: 5}},
            later: {something: 8},
        });
        
        // Should update one: 1 to be one: 10
        await db.updateQueue.add({  // @ts-ignore
            doc: doc,
            updateAt: firestore.Timestamp.fromDate(dateDayDiff(new Date(), -1)),
            key: 'one',
            diff: 9,
        });
        await db.updateQueue.add({  // @ts-ignore
            doc: doc,
            updateAt: firestore.Timestamp.fromDate(dateDayDiff(new Date(), -4)),
            key: 'two.three.four',
            diff: 10,
        });
        await db.updateQueue.add({  // @ts-ignore
            doc: doc,
            updateAt: firestore.Timestamp.fromDate(dateDayDiff(new Date(), 2)),
            key: 'later',
            diff: 12,
        });
    });

    afterEach(async () => {
        firestoreStub.restore();
        adminInitStub.restore();
        await admin.firestore().recursiveDelete(db.updateQueue);
        await admin.firestore().recursiveDelete(doc);
    });

    describe('Update for a single document', () => {
        it('Should update only when the proper time comes', async () => {
            await updates.updateProgress();
            const data = (await doc.get()).data();
            
            assert.equal(data?.one, 10, 'Should update one: 1 to 10');
            assert.equal(data?.two?.three?.four, 15, 'Should update nested properties properly');
            assert.equal(data?.later?.something, 8, 'Should not update docs scheduled for later');
        });
    });
});
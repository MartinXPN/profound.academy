import * as admin from 'firebase-admin';
import * as sinon from 'sinon';
import * as chai from 'chai';
import {config} from './testConfig';

const assert = chai.assert;

describe('Update User Info', function () {
    // Firebase connection can take long to be established
    this.timeout(5000);

    let users: typeof import('../src/services/users');
    let db: typeof import('../src/services/db').db;
    let adminInitStub: sinon.SinonStub;
    let firestoreStub: sinon.SinonStub;
    let userId: string;

    beforeEach(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => admin.firestore(app));
        users = await import('../src/services/users');
        db = (await import('../src/services/db')).db;
        userId = db.courses.doc().id;
    });

    afterEach(async () => {
        firestoreStub.restore();
        adminInitStub.restore();
        await admin.firestore().recursiveDelete(db.user(userId));
    });

    describe('Update Info Queue', () => {
        it('Update the display name', async () => {
        });
    });
});



describe('Add Courses', function () {
    // Firebase connection can take long to be established
    this.timeout(5000);

    let users: typeof import('../src/services/users');
    let db: typeof import('../src/services/db').db;
    let adminInitStub: sinon.SinonStub;
    let firestoreStub: sinon.SinonStub;
    let userId: string;

    beforeEach(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => admin.firestore(app));
        users = await import('../src/services/users');
        db = (await import('../src/services/db')).db;
        userId = db.courses.doc().id;
    });

    afterEach(async () => {
        firestoreStub.restore();
        adminInitStub.restore();
        await admin.firestore().recursiveDelete(db.user(userId));
    });

    describe('Add courses to the users curriculum', () => {
        it('Add a new course', async () => {
            await admin.firestore().runTransaction(async (transaction) => {
                await users.addCourses(transaction, userId, ['c1', 'c2']);
            });
            await admin.firestore().runTransaction(async (transaction) => {
                await users.addCourses(transaction, userId, ['c3', 'c4']);
            });

            let user = (await db.user(userId).get()).data();
            assert.equal(user?.courses?.length, 4, 'Should keep track of the courses');

            await db.user(userId).set({
                // @ts-ignore
                'completed': [db.course('c5')]
            }, {merge: true});
            await admin.firestore().runTransaction(async (transaction) => {
                await users.addCourses(transaction, userId, ['c5']);
            });
            user = (await db.user(userId).get()).data();
            assert.equal(user?.courses?.length, 4, 'Should not add back a completed course');
            assert.equal(user?.completed?.length, 1, 'Should have a single completed course');
        });
    });
});

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
        it('Process Info update for a single user', async () => {
            // Populate the DB with dummy data
            await db.user(userId).set({id: userId, displayName: 'Alice', imageUrl: ''});
            await db.userProgress('c1', userId).set({id: userId, userId: userId, userDisplayName: 'Alice', userImageUrl: '', score: 0});
            const commentId = await db.forum.add({
                id: '', userId: userId, displayName: 'Alice',
                // @ts-ignore
                createdAt: admin.firestore.FieldValue.serverTimestamp(), replies: [], score: 1, text: 'Hey!'
            });
            // @ts-ignore
            const submissionId = await db.submissionResults.add({
                id: '', isBest: true, status: 'Solved', memory: 10, time: 0.1, score: 100,
                userDisplayName: 'Alice', userImageUrl: '', userId: userId,
            });


            // Launch the update
            await db.userInfoUpdate(userId).set({id: userId, displayName: 'Bob', imageUrl: 'https://i.imgur.com/Mcvgbvm.jpeg'});
            await users.updateInfoQueue();

            // info updates
            const updates = (await db.infoUpdates.get()).docs.map((d) => d.data());
            assert.isEmpty(updates, 'Info updates should be empty after processing');

            // progress
            const progress = (await db.userProgress('c1', userId).get()).data();
            assert.equal(progress?.userDisplayName, 'Bob', 'Progress user name update');
            assert.notEqual(progress?.userImageUrl, '', 'Progress image URL should be updated');

            // forum comments
            const comment = (await db.forumComment(commentId.id).get()).data();
            assert.equal(comment?.displayName, 'Bob', 'Comment user name update');
            assert.notEqual(comment?.avatarUrl, '', 'Comment image URL should be updated');

            // submissions
            const submission = (await db.submissionResult(submissionId.id).get()).data();
            assert.equal(submission?.userDisplayName, 'Bob', 'Comment user name update');
            assert.notEqual(submission?.userImageUrl, '', 'Comment image URL should be updated');

            // user
            const user = (await db.user(userId).get()).data();
            assert.equal(user?.displayName, 'Bob', 'User info should be updated');
            assert.notEqual(user?.imageUrl, '', 'User image URL should be updated');
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

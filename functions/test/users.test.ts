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
    let commentId: string;
    let submissionId: string;

    beforeEach(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => admin.firestore(app));
        users = await import('../src/services/users');
        db = (await import('../src/services/db')).db;
        userId = db.courses.doc().id;

        // Populate the DB with dummy data
        await db.user(userId).set({id: userId, displayName: 'Alice', imageUrl: ''});
        await db.userProgress('c1', userId).set({
            id: userId, userId: userId, userDisplayName: 'Alice', userImageUrl: '', score: 0
        });
        commentId = (await db.forum.add({
            id: '', userId: userId, displayName: 'Alice',
            // @ts-ignore
            createdAt: admin.firestore.FieldValue.serverTimestamp(), replies: [], score: 1, text: 'Hey!'
        })).id;
        // @ts-ignore
        submissionId = (await db.submissionResults.add({
            id: '', isBest: true, status: 'Solved', memory: 10, time: 0.1, score: 100,
            userDisplayName: 'Alice', userImageUrl: '', userId: userId,
        })).id;
    });

    afterEach(async () => {
        firestoreStub.restore();
        adminInitStub.restore();
        await admin.firestore().recursiveDelete(db.user(userId));
        await admin.firestore().recursiveDelete(db.course('c1'));
        await admin.firestore().recursiveDelete(db.forumComment(commentId));
        await admin.firestore().recursiveDelete(db.submissionResult(submissionId));
    });

    describe('Update Info Queue', () => {
        it('Process Info update for a single user', async () => {
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
            const comment = (await db.forumComment(commentId).get()).data();
            assert.equal(comment?.displayName, 'Bob', 'Comment user name update');
            assert.notEqual(comment?.avatarUrl, '', 'Comment image URL should be updated');

            // submissions
            const submission = (await db.submissionResult(submissionId).get()).data();
            assert.equal(submission?.userDisplayName, 'Bob', 'Comment user name update');
            assert.notEqual(submission?.userImageUrl, '', 'Comment image URL should be updated');

            // user
            const user = (await db.user(userId).get()).data();
            assert.equal(user?.displayName, 'Bob', 'User info should be updated');
            assert.notEqual(user?.imageUrl, '', 'User image URL should be updated');
        });
    });

    describe('Update Single Field', () => {
        it('Process Info update for a single user', async () => {
            // Launch the update
            await db.userInfoUpdate(userId).set({id: userId, imageUrl: 'https://i.imgur.com/Mcvgbvm.jpeg'});
            await users.updateInfoQueue();

            // info updates
            const updates = (await db.infoUpdates.get()).docs.map((d) => d.data());
            assert.isEmpty(updates, 'Info updates should be empty after processing');

            // progress
            const progress = (await db.userProgress('c1', userId).get()).data();
            assert.equal(progress?.userDisplayName, 'Alice', 'Progress user name should stay the same');
            assert.notEqual(progress?.userImageUrl, '', 'Progress image URL should be updated');

            // forum comments
            const comment = (await db.forumComment(commentId).get()).data();
            assert.equal(comment?.displayName, 'Alice', 'Comment user name should stay the same');
            assert.notEqual(comment?.avatarUrl, '', 'Comment image URL should be updated');

            // submissions
            const submission = (await db.submissionResult(submissionId).get()).data();
            assert.equal(submission?.userDisplayName, 'Alice', 'Comment user name should stay the same');
            assert.notEqual(submission?.userImageUrl, '', 'Comment image URL should be updated');

            // user
            const user = (await db.user(userId).get()).data();
            assert.equal(user?.displayName, 'Alice', 'User info should be the same');
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
            await db.user(userId).set({id: userId}, {merge: true});
            await admin.firestore().runTransaction(async (transaction) => {
                await users.addCourses(transaction, ['c1', 'c2'], (await db.user(userId).get()).data()!);
            });
            await admin.firestore().runTransaction(async (transaction) => {
                await users.addCourses(transaction, ['c3', 'c4'], (await db.user(userId).get()).data()!);
            });

            let user = (await db.user(userId).get()).data();
            assert.equal(user?.courses?.length, 4, 'Should keep track of the courses');

            await db.user(userId).set({
                // @ts-ignore
                'completed': [db.course('c5')]
            }, {merge: true});
            await admin.firestore().runTransaction(async (transaction) => {
                await users.addCourses(transaction, ['c5'], (await db.user(userId).get()).data()!);
            });
            user = (await db.user(userId).get()).data();
            assert.equal(user?.courses?.length, 4, 'Should not add back a completed course');
            assert.equal(user?.completed?.length, 1, 'Should have a single completed course');
        });
    });
});

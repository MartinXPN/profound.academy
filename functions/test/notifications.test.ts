import * as admin from 'firebase-admin';
import * as sinon from 'sinon';
import * as chai from 'chai';
import {config} from './testConfig';

import {Comment} from '../src/models/forum';

const assert = chai.assert;
const expect = chai.expect;


describe('Comment Notifications', function () {
    // Firebase connection can take long to be established
    this.timeout(10000);

    let notifications: typeof import('../src/services/notifications');
    let db: typeof import('../src/services/db').db;
    let adminInitStub: sinon.SinonStub;
    let firestoreStub: sinon.SinonStub;
    let authStub: sinon.SinonStub;
    let courseId: string;
    let exerciseId: string;
    let instructor1Id: string;
    let instructor2Id: string;
    let student1Id: string;
    let student2Id: string;

    beforeEach(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => admin.firestore(app));
        authStub = sinon.stub(admin, 'auth').callsFake(() => admin.auth(app));
        notifications = await import('../src/services/notifications');
        db = (await import('../src/services/db')).db;

        instructor1Id = (await admin.auth().createUser({
            email: 'instructor1@gmail.com',
            password: 'instructor123'
        })).uid;
        instructor2Id = (await admin.auth().createUser({
            email: 'instructor2@gmail.com',
            password: 'instructor123'
        })).uid;
        student1Id = (await admin.auth().createUser({email: 'student1@gmail.com', password: 'student321'})).uid;
        student2Id = (await admin.auth().createUser({email: 'student2@gmail.com', password: 'student321'})).uid;

        courseId = db.courses.doc().id;
        exerciseId = db.courses.doc().id;
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
            instructors: [instructor1Id, instructor2Id],
            introduction: '',
            drafts: {id: 'drafts', title: 'Drafts'},
            levels: [{id: '1', title: 'Level 1'}],
            levelExercises: {},
            levelScores: {},
            exercises: [],
        });
        await db.exercise(courseId, exerciseId).set({
            id: exerciseId,
            title: 'EX TITLE',
            pageId: '',
            levelId: '1',
            order: 1.55,
            testCases: []
        });
        // @ts-ignore
        await db.user(student1Id).set({id: student1Id, courses: [db.course(courseId)]});
        // @ts-ignore
        await db.user(student2Id).set({id: student2Id, courses: [db.course(courseId)]});
    });

    afterEach(async () => {
        await admin.firestore().recursiveDelete(db.exercise(courseId, exerciseId));
        await admin.firestore().recursiveDelete(db.course(courseId));
        await admin.firestore().recursiveDelete(db.users);
        await admin.firestore().recursiveDelete(db.forum);
        await admin.auth().deleteUsers([instructor1Id, instructor2Id, student1Id, student2Id]);
        firestoreStub.restore();
        adminInitStub.restore();
        authStub.restore()
    });

    describe('Notify course instructor on comment', () => {
        it('Check if the course instructor is notified', async () => {
            const comment = {
                id: 'comm-id',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                displayName: 'Bob',
                avatarUrl: 'https://i.imgur.com/Mcvgbvm.jpeg',
                repliedTo: db.exercise(courseId, exerciseId),
                replies: [],
                score: 1,
                text: 'This is a comment from a student',
                userId: student1Id,
            } as unknown as Comment;
            const commentDoc = await db.forum.add(comment);
            await notifications.notifyOnComment(comment);

            let student1Notifications = (await db.notifications(student1Id).get()).docs.map(d => d.data());
            let student2Notifications = (await db.notifications(student2Id).get()).docs.map(d => d.data());
            let instructor1Notifications = (await db.notifications(instructor1Id).get()).docs.map(d => d.data());
            let instructor2Notifications = (await db.notifications(instructor2Id).get()).docs.map(d => d.data());
            assert.equal(student1Notifications.length, 0, 'Student 1 should not receive a notification');
            assert.equal(student2Notifications.length, 0, 'Student 2 should not receive a notification');
            assert.equal(instructor1Notifications.length, 1, 'Instructor 1 should receive a notification');
            assert.equal(instructor2Notifications.length, 1, 'Instructor 2 should receive a notification');

            const reply = {
                id: '',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                displayName: 'Tutor',
                avatarUrl: 'https://i.imgur.com/Mcvgbvm.jpeg',
                repliedTo: commentDoc,
                replies: [],
                score: 1,
                text: 'This is a comment from an instructor',
                userId: instructor1Id,
            } as unknown as Comment;
            await db.forum.add(reply);
            await notifications.notifyOnComment(reply);

            student1Notifications = (await db.notifications(student1Id).get()).docs.map(d => d.data());
            student2Notifications = (await db.notifications(student2Id).get()).docs.map(d => d.data());
            instructor1Notifications = (await db.notifications(instructor1Id).get()).docs.map(d => d.data());
            instructor2Notifications = (await db.notifications(instructor2Id).get()).docs.map(d => d.data());
            assert.equal(student1Notifications.length, 1, 'Student 1 should receive notification from a reply');
            assert.equal(student2Notifications.length, 0, 'Student 2 should not receive a notification');
            assert.equal(instructor1Notifications.length, 1, 'Instructor 1 should keep the same notifications');
            assert.equal(instructor2Notifications.length, 1, 'Instructor 2 should keep the same notifications');
        });
    });

    describe('Notify participants', () => {
        it('Notify participants when the instructor adds a comment', async () => {
            const comment = {
                id: '',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                displayName: 'Tutor',
                avatarUrl: 'https://i.imgur.com/Mcvgbvm.jpeg',
                repliedTo: db.exercise(courseId, exerciseId),
                replies: [],
                score: 1,
                text: 'This is a comment from an instructor',
                userId: instructor1Id,
            } as unknown as Comment;
            const commentDoc = await db.forum.add(comment);
            await notifications.notifyOnComment(comment);

            let student1Notifications = (await db.notifications(student1Id).get()).docs.map(d => d.data());
            let student2Notifications = (await db.notifications(student2Id).get()).docs.map(d => d.data());
            let instructor1Notifications = (await db.notifications(instructor1Id).get()).docs.map(d => d.data());
            let instructor2Notifications = (await db.notifications(instructor2Id).get()).docs.map(d => d.data());
            assert.equal(student1Notifications.length, 1, 'Student 1 should receive a notification');
            assert.equal(student2Notifications.length, 1, 'Student 2 should receive a notification');
            assert.equal(instructor1Notifications.length, 0, 'Instructor 1 should not receive a notification');
            assert.equal(instructor2Notifications.length, 0, 'Instructor 2 should not receive a notification');

            const reply = {
                id: '',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                displayName: 'Student',
                avatarUrl: 'https://i.imgur.com/Mcvgbvm.jpeg',
                repliedTo: commentDoc,
                replies: [],
                score: 1,
                text: 'This is a comment from a student',
                userId: student1Id,
            } as unknown as Comment;
            await db.forum.add(reply);
            await notifications.notifyOnComment(reply);

            student1Notifications = (await db.notifications(student1Id).get()).docs.map(d => d.data());
            student2Notifications = (await db.notifications(student2Id).get()).docs.map(d => d.data());
            instructor1Notifications = (await db.notifications(instructor1Id).get()).docs.map(d => d.data());
            instructor2Notifications = (await db.notifications(instructor2Id).get()).docs.map(d => d.data());
            assert.equal(student1Notifications.length, 1, 'Student 1 should keep the same notifications');
            assert.equal(student2Notifications.length, 1, 'Student 2 should keep the same notifications');
            assert.equal(instructor1Notifications.length, 1, 'Instructor 1 should receive a notifications');
            assert.equal(instructor2Notifications.length, 0, 'Instructor 2 should keep the same notifications');
        });
    });

    describe('Handle Edge cases', () => {
        it('Should throw an error for nonexistent values', async () => {
            const comment = {
                id: '',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                displayName: 'Tutor',
                avatarUrl: 'https://i.imgur.com/Mcvgbvm.jpeg',
                repliedTo: db.exercise(courseId, exerciseId),
                replies: [],
                score: 1,
                text: 'This is a comment from an instructor',
                userId: instructor1Id,
            } as unknown as Comment;
            // const commentDoc = await db.forum.add(comment);

            // @ts-ignore
            comment.repliedTo = db.exercise(courseId, 'random-exercise');
            expect(notifications.notifyOnComment(comment)).to.eventually.be.rejected;

            // @ts-ignore
            comment.repliedTo = db.exercise('random-course', exerciseId);
            expect(notifications.notifyOnComment(comment)).to.eventually.be.rejected;
        });
    });
});

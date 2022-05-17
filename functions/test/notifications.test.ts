import * as admin from 'firebase-admin';
import * as sinon from 'sinon';
import * as chai from 'chai';
import {config} from "./testConfig";

const assert = chai.assert;


describe('Comment Notifications', function () {
    // Firebase connection can take long to be established
    this.timeout(5000);

    let notifications: typeof import('../src/services/notifications');
    let db: typeof import('../src/services/db').db;
    let adminInitStub: sinon.SinonStub;
    let firestoreStub: sinon.SinonStub;
    let courseId: string;
    let instructorUserId: string;
    let studentUserId: string;

    beforeEach(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => admin.firestore(app));
        notifications = await import('../src/services/notifications');
        db = (await import('../src/services/db')).db;
        courseId = db.courses.doc().id;
        instructorUserId = db.users.doc().id;
        studentUserId = db.users.doc().id;
    });

    afterEach(async () => {
        firestoreStub.restore();
        adminInitStub.restore();
        await admin.firestore().recursiveDelete(db.course(courseId));
    });

    describe('Notify course instructor on comment', () => {
        it('Check if the course instructor is notified', async () => {
            // assert.isTrue(await courses.isCourseInstructor(courseId, instructorUserId), 'Instructor should be present in the list of course instructors');
            // assert.isFalse(await courses.isCourseInstructor(courseId, studentUserId), 'Student should not be present in the list of course instructors');
            // assert.isFalse(await courses.isCourseInstructor('random-id', instructorUserId), 'Nonexistent course should return false');
            // assert.isFalse(await courses.isCourseInstructor('random-id', studentUserId), 'Nonexistent course should return false');
            // assert.isFalse(await courses.isCourseInstructor(undefined, studentUserId), 'Undefined course should return false');
            // assert.isFalse(await courses.isCourseInstructor(courseId, undefined), 'Undefined user should return false');
        });
    });

    describe('Notify comment reply', () => {
        it('Check if the comment author is notified when someone replies to the comment', async () => {
        });
    });

    describe('Notify participants', () => {
        it('Notify participants when the instructor adds a comment', async () => {
        });
    });
});

import * as admin from 'firebase-admin';
import * as sinon from 'sinon';
import * as chai from 'chai';
import {config} from "./testConfig";

const assert = chai.assert;


describe('Handle Course Instructor Permissions', function () {
    // Firebase connection can take long to be established
    this.timeout(5000);

    let courses: typeof import('../src/services/courses');
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
        courses = await import('../src/services/courses');
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

    describe('Instructor for a single course', () => {
        it('Check if a user is an instructor for a course', async () => {
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
                instructors: [instructorUserId],
                introduction: '',
                levelExercises: {},
                levelScores: {},
                exercises: [],
            });

            assert.isTrue(await courses.isCourseInstructor(courseId, instructorUserId), 'Instructor should be present in the list of course instructors');
            assert.isFalse(await courses.isCourseInstructor(courseId, studentUserId), 'Student should not be present in the list of course instructors');
            assert.isFalse(await courses.isCourseInstructor('random-id', instructorUserId), 'Nonexistent course should return false');
            assert.isFalse(await courses.isCourseInstructor('random-id', studentUserId), 'Nonexistent course should return false');
            assert.isFalse(await courses.isCourseInstructor(undefined, studentUserId), 'Undefined course should return false');
            assert.isFalse(await courses.isCourseInstructor(courseId, undefined), 'Undefined user should return false');
        });
    });
});


// describe('Send Course Invite Emails', function () {
//     // Firebase connection can take long to be established
//     this.timeout(5000);
//
//     let courses: typeof import('../src/services/courses');
//     let db: typeof import('../src/services/db').db;
//     let adminInitStub: sinon.SinonStub;
//     let firestoreStub: sinon.SinonStub;
//     let courseId: string;
//
//     beforeEach(async () => {
//         const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
//         adminInitStub = sinon.stub(admin, 'initializeApp');
//         firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => admin.firestore(app));
//         courses = await import('../src/services/courses');
//         db = (await import('../src/services/db')).db;
//         courseId = db.courses.doc().id;
//     });
//
//     afterEach(async () => {
//         firestoreStub.restore();
//         adminInitStub.restore();
//         await admin.firestore().recursiveDelete(db.course(courseId));
//     });
//
//     describe('Send invitation', () => {
//         it('Check if the invitation field is populated properly', async () => {
//             // TODO: Populate invite emails and send invites
//             // TODO: send invite to the same person twice - it should ignore the second invitation
//             // assert.equal(exercise2Overall?.runs, 1, 'Exercise 2 should have only 1 value saved');
//         });
//     });
// });

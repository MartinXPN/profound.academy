import * as admin from 'firebase-admin';
import * as sinon from 'sinon';
import * as chai from 'chai';
import {config} from "./testConfig";
import {firestore} from 'firebase-admin';

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
                drafts: {id: 'drafts', title: 'Drafts'},
                levels: [{id: '1', title: 'Level 1'}],
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


describe('Send Course Invite Emails', function () {
    // Firebase connection can take long to be established
    this.timeout(5000);

    let courses: typeof import('../src/services/courses');
    let db: typeof import('../src/services/db').db;
    let adminInitStub: sinon.SinonStub;
    let firestoreStub: sinon.SinonStub;
    let courseId: string;

    beforeEach(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => admin.firestore(app));
        courses = await import('../src/services/courses');
        db = (await import('../src/services/db')).db;
        courseId = db.courses.doc().id;
    });

    afterEach(async () => {
        firestoreStub.restore();
        adminInitStub.restore();
        await admin.firestore().recursiveDelete(db.course(courseId));
        await admin.firestore().recursiveDelete(db.mails);
    });

    describe('Send invitation', () => {
        it('Check if the invitation field is populated properly', async () => {
            const emails = ['abc@gmail.com', 'cba@gmail.com', 'hey@profound'];
            await db.coursePrivateFields(courseId).set({
                id: courseId,
                invitedEmails: emails,
                mailSubject: 'Invitation!!!',
                mailText: 'You have been invited! Follow the link to participate',
            });

            await courses.sendInviteEmails(courseId);
            let invitationMails = (await db.mails.get()).docs.map(d => d.data());
            assert.equal(invitationMails.length, 3, 'We should send 3 invitation emails');

            // Send another invitation
            await db.coursePrivateFields(courseId).update({
                invitedEmails: firestore.FieldValue.arrayUnion('another@gmail.com'),
            });
            await courses.sendInviteEmails(courseId);
            invitationMails = (await db.mails.get()).docs.map(d => d.data());
            assert.equal(invitationMails.length, 4, 'We should send another invitation');

            const privateFields = (await db.coursePrivateFields(courseId).get()).data();
            chai.expect(privateFields?.sentEmails ?? []).to.include.all.members([...emails, 'another@gmail.com']);

            const sent = await courses.sendInviteEmails(courseId);
            assert.isFalse(sent, 'Should have no invitations to sent');
        });
    });
});

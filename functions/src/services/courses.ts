import * as functions from 'firebase-functions';
import {firestore} from 'firebase-admin';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';

import {db} from './db';


export const getS3UploadSignedUrl = async (exerciseId: string, contentType: string): Promise<string> => {
    const clientParams = {
        region: 'us-east-1',
        credentials: {
            accessKeyId: functions.config().instructor.id,
            secretAccessKey: functions.config().instructor.key,
        },
    };
    const s3 = new S3Client(clientParams);

    const params = {
        Bucket: 'lambda-judge-tests-bucket',
        Key: `${exerciseId}.zip`,
        expiresIn: 600, // Expires in 10 minutes
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
    };
    const command = new PutObjectCommand(params);

    const url = await getSignedUrl(s3, command, {expiresIn: 600});
    functions.logger.info(`Got URL: ${url}`);
    return url;
};


export const isCourseInstructor = async (courseId?: string, userId?: string): Promise<boolean> => {
    if (!courseId || !userId)
        return false;

    const course = (await db.course(courseId).get()).data();
    if (!course)
        return false;

    return course.instructors.includes(userId);
};

export const sendInviteEmails = async (
    courseId: string,
): Promise<boolean> => {
    functions.logger.info(`Sending invite emails for the course: ${courseId}`);

    const privateFields = (await db.coursePrivateFields(courseId).get()).data();
    const alreadySendEmails = new Set(privateFields?.sentEmails ?? []);
    const diffEmails = privateFields?.invitedEmails?.filter((e: string) => !alreadySendEmails.has(e)) ?? [];
    functions.logger.info(`Sending invite emails to: ${diffEmails}`);
    if (diffEmails.length === 0) {
        functions.logger.info('There are no emails to be sent!');
        return false;
    }

    const footer = `Sign in with your email to accept the invitation here: https://profound.academy/${courseId}`;
    const batch = firestore().batch();
    for (const email of diffEmails) {
        const id = db.mails.doc().id;
        batch.set(db.mails.doc(id), {
            to: email,
            message: {
                subject: privateFields?.mailSubject,
                text: (privateFields?.mailText ?? '') + '\n\n' + footer,
            },
        });
    }
    functions.logger.info('Committing all the changes...');
    await batch.commit();

    functions.logger.info('Updating sentEmails of the course');
    if (!privateFields || !privateFields.sentEmails || privateFields.sentEmails.length === 0)
        await db.coursePrivateFields(courseId).set({sentEmails: diffEmails}, {merge: true});
    else
        await db.coursePrivateFields(courseId).set({   // @ts-ignore
            sentEmails: firestore.FieldValue.arrayUnion(...diffEmails),
        }, {merge: true});

    functions.logger.info('Done');
    return true;
};

import * as AWS from 'aws-sdk';
import * as functions from 'firebase-functions';
import {db} from './db';


AWS.config.update({
    accessKeyId: functions.config().aws_s3.id,
    secretAccessKey: functions.config().aws_s3.key,
    region: 'us-east-1',
});

export const getS3UploadSignedUrl = (exerciseId: string, contentType: string): string => {
    const s3 = new AWS.S3();
    const s3Params = {
        Bucket: 'lambda-judge-problems',
        Key: `problems/${exerciseId}.zip`,
        Expires: 600, // Expires in 10 minutes
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
    };

    return s3.getSignedUrl('putObject', s3Params);
};


export const isCourseInstructor = async (courseId?: string, userId?: string): Promise<boolean> => {
    if (!courseId || !userId)
        return false;

    const course = (await db.course(courseId).get()).data();
    if (!course)
        return false;

    return course.instructors.includes(userId);
};

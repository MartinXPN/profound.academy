import {db} from "./db";
import {Submission, SubmissionResult} from "../models/submissions";
import firebase from "firebase/app";
import {Language} from "../models/language";
import {TestCase} from "../../functions/src/models/courses";


export const submitSolution = async (userId: string, userDisplayName: string | null,
                                     courseId: string, exerciseId: string,
                                     code: string, language: Language,
                                     isTestRun: boolean, testCases?: TestCase[]) => {
    const extension = language.extension;
    const projectCode = {[`main.${extension}`]: code};

    const courseRef = db.courses.doc(courseId);
    const exerciseRef = db.exercises(courseId).doc(exerciseId);
    // @ts-ignore
    const submission = {
        id: '',
        userId: userId,
        userDisplayName: userDisplayName,
        course: courseRef,
        exercise: exerciseRef,
        testCases: testCases,
        code: projectCode,
        language: language.languageCode,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isTestRun: isTestRun,
    } as Submission;

    const snapshot = await db.submissionQueue(userId).add(submission);
    console.log('submit document result:', snapshot);
    return snapshot.id;
}

export const onRunResultChanged = (userId: string, submissionId: string,
                                   onChanged: (submissionResult: SubmissionResult | undefined) => void) => {
    const resultSnapshot = db.run(userId, submissionId);
    return resultSnapshot.onSnapshot(doc => {
        const res = doc.data();
        console.log('Run result changed:', submissionId, res);
        onChanged(res);
    })
}


export const onSubmissionResultChanged = (submissionId: string,
                                          onChanged: (submissionResult: SubmissionResult | null) => void) => {
    const resultSnapshot = db.submissionResult(submissionId);
    return resultSnapshot.onSnapshot(doc => {
        const res = doc.data();
        console.log('Submission result changed:', submissionId, res);
        onChanged(res ?? null);
    })
}

export const getSubmissions = async (courseId: string, exerciseId: string) => {
    const exercise = db.exercise(courseId, exerciseId);
    const snapshot = await db.submissionResults.where('exercise', '==', exercise)
        .orderBy('createdAt', 'desc')
        .get();
    const submissions = snapshot.docs.map(d => d.data());
    console.log('Got submissions for exercise:', exerciseId, submissions);
    return submissions;
}

export const getBestSubmissions = async (courseId: string, exerciseId: string) => {
    const exercise = db.exercise(courseId, exerciseId);
    const snapshot = await db.submissionResults
        .where('exercise', '==', exercise)
        .where('isBest', '==', true)
        .where('status', '==', 'Solved')
        .orderBy('score', 'desc')
        .orderBy('time', 'asc')
        .orderBy('memory', 'asc')
        .get();
    const submissions = snapshot.docs.map(d => d.data());
    console.log('Got submissions for exercise:', exerciseId, submissions);
    return submissions;
}

export const getSubmissionCode = async (userId: string, submissionId: string) => {
    const snapshot = await db.submissionSensitiveRecords(userId, submissionId).get();
    const records = snapshot.data();

    if( !records )
        throw Error('The record does not exist!');
    return records.code;
}

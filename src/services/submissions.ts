import {db} from "./db";
import {Submission, SubmissionResult} from "../models/submissions";
import firebase from "firebase/app";
import 'firebase/storage';
import {Language} from "../models/language";


export const submitSolution = async (userId: string, userDisplayName: string | null, courseId: string, exerciseId: string, code: string, language: Language, isTestRun: boolean) => {
    const extension = language.extension;
    const ref = firebase.storage().ref(`submissions/${userId}/${exerciseId}/${new Date().toISOString()}/main.${extension}`);
    await ref.putString(code, firebase.storage.StringFormat.RAW);
    const downloadURL = await ref.getDownloadURL();

    const courseRef = db.courses.doc(courseId);
    const exerciseRef = db.exercises(courseId).doc(exerciseId);
    // @ts-ignore
    const submission = {
        id: '',
        userId: userId,
        userDisplayName: userDisplayName,
        course: courseRef,
        exercise: exerciseRef,
        submissionFileURL: downloadURL,
        language: language.languageCode,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isTestRun: isTestRun,
    } as Submission;

    const snapshot = await db.submissionQueue(userId).add(submission);
    console.log('submit document result:', snapshot);
    return snapshot.id;
}


export const onSubmissionResultChanged = (submissionId: string, onChanged: (submissionResult: SubmissionResult | undefined) => void) => {
    const resultSnapshot = db.submissionResult(submissionId);
    return resultSnapshot.onSnapshot(doc => {
        const res = doc.data();
        console.log('Submission result changed:', submissionId, res);
        onChanged(res);
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

export const getBestSubmissions = async (exerciseId: string) => {
    const snapshot = await db.bestSubmissions(exerciseId)
        .where('status', '==', 'Solved')
        .orderBy('score', 'desc')
        .orderBy('time', 'asc')
        .orderBy('memory', 'asc')
        .get();
    const submissions = snapshot.docs.map(d => d.data());
    console.log('Got submissions for exercise:', exerciseId, submissions);
    return submissions;
}

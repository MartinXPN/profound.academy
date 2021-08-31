import {db} from "./db";
import {Submission, SubmissionResult} from "../models/submissions";
import firebase from "firebase/app";
import 'firebase/storage';
import {Language} from "../models/language";


export const submitSolution = async (userId: string, courseId: string, exerciseId: string, code: string, language: Language, isTestRun: boolean) => {
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
        course: courseRef,
        exercise: exerciseRef,
        submissionFileURL: downloadURL,
        language: language.languageCode,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isTestRun: isTestRun,
    } as Submission;

    const snapshot = await db.submissions(userId).add(submission);
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
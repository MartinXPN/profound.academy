import {db} from "./db";
import {LANGUAGE2EXTENSION, LANGUAGES, Submission} from "../models/submissions";
import firebase from "firebase/app";
import 'firebase/storage';


export const submitSolution = async (userId: string, courseId: string, exerciseId: string, code: string, language: keyof typeof LANGUAGES, isTestRun: boolean) => {
    const extension = LANGUAGE2EXTENSION[LANGUAGES[language]];
    const ref = firebase.storage().ref(`submissions/${userId}/${exerciseId}/${new Date().toISOString()}/main.${extension}`);
    await ref.putString(code, firebase.storage.StringFormat.RAW);
    const downloadURL = await ref.getDownloadURL();

    const exerciseRef = db.exercises(courseId).doc(exerciseId)
    // @ts-ignore
    const submission = {
        id: '',
        userId: userId,
        exercise: exerciseRef,
        submissionFileURL: downloadURL,
        language: language,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isTestRun: isTestRun,
    } as Submission;

    const snapshot = await db.submissions(userId).add(submission);
    const sub = await snapshot.get();
    console.log(sub);
    return sub;
}

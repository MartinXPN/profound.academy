import {db} from "./db";
import {LANGUAGE2EXTENSION, LANGUAGES, Submission} from "../models/submissions";
import firebase from "firebase/app";
import 'firebase/storage';


export const submitSolution = async (userId: string, courseId: string, exerciseId: string, code: string, language: keyof typeof LANGUAGES, isTestRun: boolean) => {
    const ref = firebase.storage().ref(`submissions/${userId}/${exerciseId}/${new Date().toISOString()}/main.${LANGUAGE2EXTENSION[language]}`);
    await ref.putString(code, firebase.storage.StringFormat.RAW);
    const downloadURL = await ref.getDownloadURL();

    const exerciseRef = firebase.firestore().collection(`courses/${courseId}/exercises/`).doc(exerciseId)
    // @ts-ignore
    const submission = {
        id: '',
        userId: userId,
        exercise: exerciseRef,
        submissionFileURL: downloadURL,
        language: language,
        isTestRun: isTestRun,
    } as Submission;

    const snapshot = await db.submissions(userId).add(submission);
    const sub = await snapshot.get();
    console.log(sub);
    return sub;
}

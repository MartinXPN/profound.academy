import {db} from "./db";
import {LANGUAGES} from "../models/language";
import firebase from "firebase";
import {CodeDraft, TextSelection} from "../models/codeDrafts";

export const saveCode = async (
    courseId: string,
    exerciseId: string,
    userId: string,
    userDisplayName: string,
    language: keyof typeof LANGUAGES,
    code?: { [key: string]: string },
    selection?: TextSelection
) => {
    await db.codeDraft(courseId, exerciseId, userId).set({
        userDisplayName: userDisplayName,
        language: language,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        code: code,
        selection: selection,
    }, {merge: true});
}

export const onCodeChanged = (
    courseId: string,
    exerciseId: string,
    userId: string,
    onChanged: (code: CodeDraft | null) => void,
) => {
    return db.codeDraft(courseId, exerciseId, userId).onSnapshot(snapshot => {
        const code = snapshot.data();
        onChanged(code ?? null);
    })
}
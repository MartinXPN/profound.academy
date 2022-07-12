import {db} from "./db";
import {LANGUAGES} from "models/language";
import firebase from "firebase/compat/app";
import {CodeDraft, TextSelection} from "models/codeDrafts";

export const saveCode = async (
    courseId: string,
    exerciseId: string,
    userId: string,
    language: keyof typeof LANGUAGES,
    userDisplayName?: string,
    userImageUrl?: string,
    code?: { [key: string]: string },
    selection?: TextSelection
) => {
    await db.codeDraft(courseId, exerciseId, userId).set({
        userDisplayName: userDisplayName,
        userImageUrl: userImageUrl,
        language: language,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
        code: code,
        selection: selection,
    }, {merge: true});
}

export const getCodeDrafts = async (courseId: string, exerciseId: string) => {
    const snapshot = await db.codeDrafts(courseId, exerciseId).orderBy('updatedAt', 'desc').get();
    const codeDrafts = snapshot.docs.map(d => d.data());
    console.log('Got codeDrafts:', codeDrafts);
    return codeDrafts;
};

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
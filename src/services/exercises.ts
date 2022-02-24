import {db} from "./db";
import {Exercise, EXERCISE_TYPES, TestCase} from "models/courses";
import firebase from "firebase";
import axios from "axios";
import {LANGUAGES} from "models/language";
import {Insight} from "models/lib/courses";

export const getFirstExercise = async (courseId: string) => {
    const exercise = await db.exercises(courseId).orderBy("order", "asc").limit(1).get();
    return exercise.docs?.[0]?.data() ?? null;
}

export const getCourseLevelExercises = async (courseId: string, level: number) => {
    const snapshot = await db.exercises(courseId)
        .orderBy('order', 'asc')
        .where('order', '>=', level)
        .where('order', '<', level + 1 )
        .get();

    const exercises: Exercise[] = snapshot.docs.map(x => x.data());
    console.log(`Got level-${level} exercises`, exercises);
    return exercises;
}

export const onCourseLevelExercisesChanged = (courseId: string, level: number, onChanged: (exercises: Exercise[]) => void) => {
    return db.exercises(courseId)
        .orderBy('order', 'asc')
        .where('order', '>=', level)
        .where('order', '<', level + 1 )
        .onSnapshot(snapshot => {
            const exercises = snapshot.docs.map(d => d.data());
            console.log(`Got level-${level} exercises`, exercises);
            onChanged(exercises ?? []);
        });
}

export const createCourseExercise = async (courseId: string) => {
    const ref = await db.exercises(courseId).add({
        id: '',
        title: '',
        pageId: '',
        order: 0,
        testCases: [],
    });
    return await getExercise(courseId, ref.id);
}

export const getExercise = async (courseId: string, exerciseId: string) => {
    const exercise = await db.exercise(courseId, exerciseId).get();
    return exercise.data() ?? null;
}

export const updateExercise = async (
    courseId: string, exerciseId: string,
    title: {[key: string]: string}, pageId: {[key: string]: string},
    order: number, score: number, allowedAttempts: number,
    exerciseType: keyof typeof EXERCISE_TYPES,
    unlockContent: string[],
    allowedLanguages?: (keyof typeof LANGUAGES)[],
    memoryLimit?: number, timeLimit?: number, outputLimit?: number,
    floatPrecision?: number, comparisonMode?: 'whole' | 'token' | 'custom', testCases?: TestCase[],
    question?: string, answer?: string, options?: string[],
) => {
    const previousValues = (await db.exercise(courseId, exerciseId).get()).data();
    const prevOrder = previousValues?.order ?? 0;
    const prevScore = previousValues?.score ?? 0;
    const prevLevelName = `${Math.trunc(prevOrder)}`;
    const newLevelName = `${Math.trunc(order)}`;

    await db.exercise(courseId, exerciseId).set({
        order: order,
        score: score,
        allowedAttempts: allowedAttempts,
        exerciseType: exerciseType,
        unlockContent: unlockContent,
        allowedLanguages: allowedLanguages,
        memoryLimit: memoryLimit,
        timeLimit: timeLimit,
        outputLimit: outputLimit,
        floatPrecision:  floatPrecision,
        comparisonMode: comparisonMode,
        testCases: testCases,
        question: question,
        options: options,
    }, {merge: true});
    await db.exercise(courseId, exerciseId).update({
        title: title,
        pageId: pageId,
    });
    if( answer )
        await db.exercisePrivateFields(courseId, exerciseId).set({answer: answer}, {merge: true});

    // update the course as well (levelExercises and levelScores)
    if( prevLevelName !== newLevelName ) {
        await db.course(courseId).set({
            // @ts-ignore
            levelExercises: {
                ...(prevLevelName !== '0' && {[prevLevelName]: firebase.firestore.FieldValue.increment(-1)}),
                ...(newLevelName !== '0' && {[newLevelName]: firebase.firestore.FieldValue.increment(1)}),
            },
            levelScores: {
                ...(prevLevelName !== '0' && {[prevLevelName]: firebase.firestore.FieldValue.increment(-prevScore)}),
                ...(newLevelName !== '0' && {[newLevelName]: firebase.firestore.FieldValue.increment(score)}),
            },
        }, {merge: true});
    }
    else if( prevScore !== score && newLevelName !== '0' ) {
        await db.course(courseId).set({
            // @ts-ignore
            levelScores: {[newLevelName]: firebase.firestore.FieldValue.increment(score - prevScore)},
        }, {merge: true});
    }
}

export const onExerciseInsightsChanged = (courseId: string, exerciseId: string, onChanged: (insights: Insight) => void) => {
    return db.exerciseInsights(courseId, exerciseId).onSnapshot(snapshot => {
        const insights = snapshot.data();
        console.log('exercise insights changed:', insights);
        onChanged(insights ?? {runs: 0, solved: 0, submissions: 0, users: 0});
    });
}


export const getExercisePrivateFields = async (courseId: string, exerciseId: string) => {
    const snapshot = await db.exercisePrivateFields(courseId, exerciseId).get();
    return snapshot.data();
}

export const updateTestCases = async (
    courseId: string, exerciseId: string, file: File,
    onProgressChanged: (progress: number) => void,
) => {
    onProgressChanged(5);
    const uploadUrl = await firebase.functions().httpsCallable('getS3UploadUrl')({
        courseId: courseId,
        exerciseId: exerciseId,
        contentType: file.type,
    });
    console.log('uploadURL:', uploadUrl.data);

    const res = await axios.request({
        method: 'put',
        url: uploadUrl.data,
        data: file,
        headers: {
            'Content-Type': file.type,
            'x-amz-server-side-encryption': 'AES256'
        },
        onUploadProgress: p => {
            onProgressChanged(100 * p.loaded / p.total);
            console.log('progress:', p);
        },
    });
    onProgressChanged(100);
    console.log('uploaded the zip file:', res);
}


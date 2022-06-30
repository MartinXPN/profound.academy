import {db} from "./db";
import {Exercise, EXERCISE_TYPES, PrivateTestsSummary, TestCase} from "models/exercise";
import firebase from "firebase/compat/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import {LANGUAGES} from "models/language";
import {Insight} from "models/lib/courses";
import {SubtaskTestGroup} from "models/lib/exercise";

export const getFirstExercise = async (courseId: string, levelId: string) => {
    const exercise = await db.exercises(courseId)
        .where('levelId', '==', levelId)
        .orderBy('order', 'asc')
        .limit(1).get();
    return exercise.docs?.[0]?.data() ?? null;
}

export const getCourseLevelExercises = async (courseId: string, level: string) => {
    const snapshot = await db.exercises(courseId)
        .where('levelId', '==', level)
        .orderBy('order', 'asc')
        .get();

    const exercises: Exercise[] = snapshot.docs.map(x => x.data());
    console.log(`Got level-${level} exercises`, exercises);
    return exercises;
}

export const onCourseLevelExercisesChanged = (courseId: string, level: string, onChanged: (exercises: Exercise[]) => void) => {
    return db.exercises(courseId)
        .where('levelId', '==', level)
        .orderBy('order', 'asc')
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
        levelId: 'drafts',
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
    level: string, order: number, score: number, allowedAttempts: number,
    exerciseType: keyof typeof EXERCISE_TYPES,
    unlockContent: string[],
    allowedLanguages?: (keyof typeof LANGUAGES)[],
    memoryLimit?: number, timeLimit?: number, outputLimit?: number,
    floatPrecision?: number, comparisonMode?: 'whole' | 'token' | 'custom',
    testCases?: TestCase[], testGroups?: SubtaskTestGroup[],
    question?: string, answer?: string, options?: string[],
) => {
    const [course, previousValues] = await Promise.all([
        (await db.course(courseId).get()).data(),
        (await db.exercise(courseId, exerciseId).get()).data(),
    ]);
    const prevScore = previousValues?.score ?? 0;
    const prevLevel = previousValues?.levelId;

    await db.exercise(courseId, exerciseId).set({
        levelId: level,
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
        testGroups: testGroups,
        question: question,
        options: options,
    }, {merge: true});

    const batch = firebase.firestore().batch();
    // Update title and pageId as we don't want to merge {local: content} maps - we want to change them
    // in case we remove an element
    batch.update(db.exercise(courseId, exerciseId),{
        title: title,
        pageId: pageId,
    });
    if( answer )
        batch.set(db.exercisePrivateFields(courseId, exerciseId), {answer: answer}, {merge: true});

    // update the course as well (level.exercises and level.scores)
    const update = {
        'drafts': {...course?.drafts ?? {id: 'drafts', title: 'Drafts', score: 0, exercises: 0}},
        'levels': [...course?.levels ?? []],
    };
    const prevLevelIndex = update.levels.findIndex(item => item.id === prevLevel);
    if( prevLevel === 'drafts' ) {
        update.drafts.exercises -= 1;
        update.drafts.score -= prevScore;
    }
    else if( prevLevelIndex !== -1 ) {
        update.levels[prevLevelIndex].exercises -= 1;
        update.levels[prevLevelIndex].score -= prevScore;
    }

    const levelIndex = update.levels.findIndex(item => item.id === level);
    if( level === 'drafts' ) {
        update.drafts.exercises += 1;
        update.drafts.score += score;
    }
    else if( levelIndex !== -1 ) {
        update.levels[levelIndex].exercises += 1;
        update.levels[levelIndex].score += score;
    }

    batch.set(db.course(courseId), update, {merge: true});
    return await batch.commit();
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

export const getExercisePrivateTestSummaries = async (courseId: string, exerciseId: string): Promise<PrivateTestsSummary> => {
    const functions = getFunctions();
    const getSummaries = httpsCallable(functions, 'getPrivateTestsSummary');

    const summaries = await getSummaries({courseId: courseId, exerciseId: exerciseId});
    console.log('Private summaries:', summaries);
    return summaries.data as PrivateTestsSummary;
}

export const updateTestCases = async (
    courseId: string, exerciseId: string, file: File,
    onProgressChanged: (progress: number) => void,
) => {
    onProgressChanged(3);
    const functions = getFunctions();
    const upload = httpsCallable(functions, 'getS3UploadUrl');

    const uploadUrl = await upload({
        courseId: courseId,
        exerciseId: exerciseId,
        contentType: file.type,
    });
    console.log('uploadURL:', uploadUrl.data);
    onProgressChanged(7);
    if( !uploadUrl || !uploadUrl.data )
        return onProgressChanged(0);

    const axios = (await import('axios')).default;
    const res = await axios.request({
        method: 'put',
        url: uploadUrl.data as string,
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

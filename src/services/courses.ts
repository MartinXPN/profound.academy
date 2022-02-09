import {db} from "./db";
import {Course, Exercise, EXERCISE_TYPES, ExerciseProgress, Progress} from "../models/courses";
import firebase from "firebase/app";
import {SubmissionStatus} from "../models/submissions";
import {LANGUAGES} from "../models/language";
import axios from "axios";

export const getNotionPageMap = async (pageId: string) => {
    const GET_NOTION_ENDPOINT = 'https://us-central1-profound-academy.cloudfunctions.net/getNotionPage';
    const res = await fetch(`${GET_NOTION_ENDPOINT}?pageId=${pageId}`, {method: 'GET', mode: 'cors'});
    return res.json();
}


export const getAllCourses = async () => {
    const snapshot = await db.courses.where('visibility', '==', 'public').get();
    const courses: Course[] = snapshot.docs.map(x => x.data());
    console.log('Got courses:', courses);
    return courses;
}

export const doesExist = async (courseId: string) => {
    const snapshot = await db.course(courseId).get();
    console.log(`${courseId} exists: ${snapshot.exists}`);
    return snapshot.exists;
}

export const getCourse = async (id: string) => {
    const snapshot = await db.course(id).get();
    const course: Course = snapshot.data() as Course;
    return course;
}

export const getCourses = async (courseIds: string[]) => {
    const courses: Course[] = await Promise.all(courseIds.map(id => getCourse(id)));
    console.log('Got courses:', courses);
    return courses;
}

export const searchCourses = async (title: string, limit: number = 20) => {
    const snapshot = await db.courses
        .where('title', '>=', title.toUpperCase())
        .where('title', '<=', title.toLowerCase() + '\uf8ff')
        .limit(limit)
        .get();
    const courses = snapshot.docs.map(d => d.data());
    console.log('Found courses:', courses);
    return courses;
}

export const getUserCourses = async (userId: string) => {
    const snap = await db.user(userId).get();
    const us = snap.data();
    if (!us || !us.courses)
        return [];

    const courses: Course[] = await Promise.all(us.courses.map(x => getCourse(x.id)));
    console.log('User courses:', courses);
    return courses;
}

export const getCompletedCourses = async (userId: string) => {
    const snap = await db.user(userId).get();
    const us = snap.data();
    if (!us || !us.completed)
        return [];

    const courses: Course[] = await Promise.all(us.completed.map(x => getCourse(x.id)));
    console.log('Completed courses:', courses);
    return courses;
}

export const startCourse = async (userId: string, courseId: string) => {
    const course = db.course(courseId);
    const user = (await db.user(userId).get()).data();
    console.log('User:', user);
    if( user && user.courses && user.courses.length > 0 ) {
        console.log('Adding course to pre-existing list of courses');
        return await db.user(userId).update({
            courses: firebase.firestore.FieldValue.arrayUnion(course)
        });
    }

    if (!user) { // @ts-ignore
        return await db.user(userId).set({courses: [course]})
    }

    console.log('Adding courses from scratch');
    return await db.user(userId).update({
        courses: [course],
    })
}

export const updateCourse = async (
    id: string, img: string,
    revealsAt: Date, freezesAt: Date,
    visibility: 'public' | 'unlisted' | 'private', rankingVisibility: 'public' | 'private', allowViewingSolutions: boolean,
    title: string, author: string, instructors: string[], details: string, introduction: string) => {
    console.log('update course:', id, img, revealsAt, freezesAt, visibility, rankingVisibility, allowViewingSolutions);
    const exists = await doesExist(id);
    return db.course(id).set({
        img: img,
        revealsAt: firebase.firestore.Timestamp.fromDate(revealsAt),
        freezeAt: firebase.firestore.Timestamp.fromDate(freezesAt),
        visibility: visibility,
        rankingVisibility: rankingVisibility,
        allowViewingSolutions: allowViewingSolutions,
        title: title,
        author: author,
        instructors: instructors,
        details: details,
        introduction: introduction,
        ...(!exists && {levelExercises: {'1': 0}}),
    }, {merge: true});
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
    allowedLanguages: (keyof typeof LANGUAGES)[],
    memoryLimit?: number, timeLimit?: number, outputLimit?: number,
    floatPrecision?: number, comparisonMode?: 'whole' | 'token' | 'custom',
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
    }, {merge: true});
    await db.exercise(courseId, exerciseId).update({
        title: title,
        pageId: pageId,
    });

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


export const onProgressChanged = (courseId: string, metric: string, onChanged: (progress: Progress[]) => void ) => {

    return db.progress(courseId).orderBy(metric, 'desc').onSnapshot(snapshot => {
        const res = snapshot.docs.map(d => d.data());
        console.log(`${metric} - progress changed:`, res);
        onChanged(res ?? []);
    })
}

export const onUserProgressChanged = (courseId: string, userId: string, onChanged: (progress: Progress | null) => void) => {
    return db.userProgress(courseId, userId).onSnapshot(snapshot => {
        const res = snapshot.data();
        console.log('User progress updated:', res);
        onChanged(res ?? null);
    });
}

export const onLevelExerciseProgressChanged = <T>(courseId: string, level: string,
                                                  metric: string,
                                                  onChanged: (userIdToProgress: { [key: string]: { [key: string]: T } }) => void) => {
    if( !metric.startsWith('exercise') )
        throw Error(`Invalid metric provided: ${metric}`);
    return db.levelExerciseProgress(courseId, level, metric).onSnapshot(snapshot => {
        // @ts-ignore
        const res: ExerciseProgress<T>[] = snapshot.docs.map(d => d.data());
        console.log('Level progress updated:', res);
        const userIdToProgress = res.reduce((obj, item) => {
            return {...obj, [item.userId]: item.progress}
        }, {});
        console.log(userIdToProgress);
        onChanged(userIdToProgress);
    })
}


export const onCourseExerciseProgressChanged = (courseId: string,
                                                userId: string,
                                                level: string,
                                                onChanged: (progress: ExerciseProgress<SubmissionStatus> | null) => void) => {
    return db.courseExerciseProgress(courseId, userId, level).onSnapshot(snapshot => {
        const res = snapshot.data();
        console.log('Exercise Progress for level', level, ':', res);
        onChanged(res ?? null);
    });
}

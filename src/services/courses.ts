import {db} from "./db";
import {Course, Exercise, ExerciseProgress, Progress} from "../models/courses";
import firebase from "firebase/app";
import {SubmissionStatus} from "../models/submissions";

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
    return snapshot.exists;
}

export const getCourse = async (id: string) => {
    const snapshot = await db.course(id).get();
    const course: Course = snapshot.data() as Course;
    return course;
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

export const updateCourse = async (course: Course) => {
    return db.course(course.id).set(course, {merge: true});
}

export const getExercise = async (courseId: string, exerciseId: string) => {
    const exercise = await db.exercise(courseId, exerciseId).get();
    return exercise.data() ?? null;
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


export const onProgressChanged = (courseId: string, metric: 'score' | 'solved' | 'upsolveScore', onChanged: (progress: Progress[]) => void ) => {

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
                                                  metric: 'exerciseScore' | 'exerciseSolved' | 'exerciseUpsolveScore',
                                                  onChanged: (userIdToProgress: { [key: string]: { [key: string]: T } }) => void) => {
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

import {db} from "./db";
import {Course, Exercise, ExerciseProgress, Progress} from "../models/courses";
import firebase from "firebase/app";
import {SubmissionStatus} from "../models/submissions";

export const getNotionPageMap = async (pageId: string) => {
    const getPage = firebase.functions().httpsCallable('getNotionPage');
    const map = await getPage({pageId: pageId});
    return map.data;
}


export const getAllCourses = async () => {
    const snapshot = await db.courses.where('visibility', '==', 'public').get();
    const courses: Course[] = snapshot.docs.map(x => x.data());
    console.log('Got courses:', courses);
    return courses;
}

export const getCourse = async (id: string) => {
    const snapshot = await db.course(id).get();
    const course: Course = snapshot.data() as Course;
    console.log('Get course:', course);
    return course;
}

export const getUserCourses = async (userId: string) => {
    const snap = await db.user(userId).get();
    console.log('snap:', snap);
    const us = snap.data();
    if (!us || !us.courses)
        return [];

    const courses: Course[] = await Promise.all(us.courses.map(x => getCourse(x.id)));
    console.log('User courses:', courses);
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


export const getCourseExercises = async (courseId: string) => {
    const snapshot = await db.exercises(courseId).orderBy('order', 'asc').get();

    const exercises: Exercise[] = snapshot.docs.map(x => x.data());
    console.log('Got exercises:', exercises);
    return exercises;
}


export const onProgressChanged = (courseId: string, metric: 'score' | 'solved' | 'upsolveScore', onChanged: (progress: Progress[]) => void ) => {
    // const levelMetric = 'level' + metric.charAt(0).toUpperCase() + metric.slice(1);

    return db.progress(courseId).orderBy(metric, 'desc').onSnapshot(snapshot => {
        const res = snapshot.docs.map(d => d.data());
        console.log(`${metric} - progress changed:`, res);
        onChanged(res ?? []);
    })
}

export const onUserProgressChanged = (courseId: string, userId: string, onChanged: (progress: Progress | null) => void) => {
    console.log('Requesting user progress...');
    return db.userProgress(courseId, userId).onSnapshot(snapshot => {
        const res = snapshot.data();
        console.log('User progress updated:', res);
        onChanged(res ?? null);
    });
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

import {db} from "./db";
import {Course, Exercise} from "../models/courses";
import firebase from "firebase/app";


export const getAllCourses = async () => {
    const snapshot = await db.courses.get();
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
    const snap = await db.users.doc(userId).get();
    console.log('snap:', snap);
    const us = snap.data();
    if (!us || !us.courses)
        return [];

    const courses: Course[] = await Promise.all(us.courses.map(x => getCourse(x.id)));
    console.log('courses:', courses);
    return courses;
}

export const startCourse = async (userId: string, courseId: string) => {
    const course = db.course(courseId);
    const allUsers = await db.users.get();

    console.log('All users:', allUsers.docs.map(d => d.data()));
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
    const snapshot = await db.exercises(courseId)
        .orderBy('order', 'asc')
        .get();

    const exercises: Exercise[] = snapshot.docs.map(x => x.data());
    console.log('Got exercises:', exercises);
    return exercises;
}

import {db} from "./db";
import {Tutorial} from "../models/tutorials";


export const getCourseTutorials = async (courseId: string) => {
    const course = db.courses.doc(courseId);
    const snapshot = await db.tutorials
        .where('course', '==', course)
        .orderBy('order', 'asc')
        .get();

    const tutorials: Tutorial[] = snapshot.docs.map(x => x.data());
    console.log('Got tutorials:', tutorials);
    return tutorials;
}

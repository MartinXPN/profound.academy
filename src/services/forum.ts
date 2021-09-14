import {db} from "./db";
import {Comment} from '../models/forum';

export const getExerciseComments = async (courseId: string, exerciseId: string) => {
    const exercise = db.exercise(courseId, exerciseId);
    const snap = await db.forum
        .where('repliedTo', '==', exercise)
        .orderBy('createdAt', 'asc')
        .get();

    console.log('snap:', snap);
    const comments: Comment[] = snap.docs.map(x => x.data());
    console.log('comments:', comments);
    return comments;
}

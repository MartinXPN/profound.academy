import {db} from "./db";
import {Activity, Progress} from "../models/users";

export const getUserProgress = async (userId: string, courseId: string) => {
    const snapshot = await db.progress(userId, courseId).get();

    const progresses: Progress[] = snapshot.docs.map(x => x.data());
    const res = progresses.reduce((newObj, x) => ({...newObj, [x.id]: x}), {})

    console.log('Got progresses:', progresses);
    console.log('Got res:', res);
    return res;
}

export const onUserProgressUpdated = (userId: string, courseId: string, onUpdate: (p: {[key: string]: Progress }) => void) => {
    return db.progress(userId, courseId).onSnapshot(snapshot => {
        const progresses: Progress[] = snapshot.docs.map(x => x.data());
        const res = progresses.reduce((newObj, x) => ({...newObj, [x.id]: x}), {})
        console.log('Got progresses:', progresses);
        console.log('Got res:', res);
        onUpdate(res);
    });
}

export const getUserActivity = async (userId: string) => {
    const snapshot = await db.activity(userId).get();
    const activity: Activity[] = snapshot.docs.map(x => x.data());
    console.log('Got activity:', activity);
    return activity;
}

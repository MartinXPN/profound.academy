import {db} from "./db";
import {Progress} from "../models/users";

export const getUserProgress = async (userId: string, courseId: string) => {
    const snapshot = await db.progress(userId, courseId).get();

    const progresses: Progress[] = snapshot.docs.map(x => x.data());
    const res = progresses.reduce((newObj, x) => ({...newObj, [x.id]: x}), {})

    console.log('Got progresses:', progresses);
    console.log('Got res:', res);
    return res;
}

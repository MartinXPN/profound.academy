import {db} from "./db";
import {Level} from "models/levels";

export const newLevel = (courseId: string) => {
    return db.course(courseId).collection('levels').doc().id;
}

export const saveLevels = async (courseId: string, levels: Level[]) => {
    return db.course(courseId).set({
        levels: levels,
    }, {merge: true});
}

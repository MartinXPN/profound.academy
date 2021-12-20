import {db} from "./db";
import {Activity} from "../models/users";

export const getUserActivity = async (userId: string) => {
    const snapshot = await db.activity(userId).get();
    const activity: Activity[] = snapshot.docs.map(x => x.data());
    console.log('Got activity:', activity);
    return activity;
}

export const getUserInfo = async (userId: string) => {
    const snapshot = await db.user(userId).get();
    const user = snapshot.data();
    console.log('Got user info:', user);
    return user ?? null;
}

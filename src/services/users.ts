import {db} from "./db";
import {Activity} from "../models/users";
import firebase from "firebase";

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

export const updateUserInfo = async (userId: string, displayName?: string, imageUrl?: string) => {
    const user = firebase.auth().currentUser;
    if( !user )
        return;

    if( user.displayName !== displayName || user.photoURL !== imageUrl )
        await user.updateProfile({
            displayName: displayName,
            photoURL: imageUrl,
        });

    await db.user(userId).set({
        displayName: displayName,
        imageUrl: imageUrl,
    }, {merge: true});
}

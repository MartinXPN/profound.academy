import {db} from "./db";
import {Activity, User} from "../models/users";
import firebase from "firebase";

export const getUserActivity = async (userId: string) => {
    const snapshot = await db.activity(userId).get();
    const activity: Activity[] = snapshot.docs.map(x => x.data());
    console.log('Got activity:', activity);
    return activity;
}

export const onUserInfoChanged = (userId: string, onChanged: (user: User | null) => void) => {
    return db.user(userId).onSnapshot(snapshot => {
        const user = snapshot.data();
        console.log('Got user info:', user);
        onChanged(user ?? null);
    });
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

export const uploadProfilePicture = async (userId: string, file: File) => {
    const ref = firebase.storage().ref(`profilePictures/${userId}/${file.name}`);
    await ref.put(file);
    const imageUrl = await ref.getDownloadURL();
    return updateUserInfo(userId, undefined, imageUrl);
}

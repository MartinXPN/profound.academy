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

    await db.user(userId).set({displayName: displayName, imageUrl: imageUrl}, {merge: true});
    await db.userInfoUpdate(userId).set({displayName: displayName, imageUrl: imageUrl}, {merge: true});
}

export const uploadProfilePicture = async (userId: string, file: File) => {
    const ref = firebase.storage().ref(`profilePictures/${userId}/${file.name}`);
    await ref.put(file);
    const imageUrl = await ref.getDownloadURL();
    return updateUserInfo(userId, undefined, imageUrl);
}

export const uploadPicture = async (userId: string, file: File) => {
    const ref = firebase.storage().ref(`pictures/${userId}/${file.name}`);
    await ref.put(file);
    return await ref.getDownloadURL();
}

export const searchUser = async (name: string, limit: number = 20) => {
    const snapshot = await db.users
        .where('displayName', '>=', name.toUpperCase())
        .where('displayName', '<=', name.toLowerCase() + '\uf8ff')
        .limit(limit)
        .get();
    const users = snapshot.docs.map(d => d.data());
    console.log('Found users:', users);
    return users;
}

export const getUsers = async (userIds: string[]) => {
    const snapshots = await Promise.all(userIds.map(id => db.user(id).get()));
    const users = snapshots.map(s => s.data()).filter(u => u !== undefined) as User[];
    console.log('Found users:', users);
    return users;
}

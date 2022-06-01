import {db} from "./db";
import {Activity, User} from "models/users";
import firebase from "firebase/compat/app";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export const getUserActivity = async (userId: string) => {
    const snapshot = await db.activity(userId).get();
    const activity: Activity[] = snapshot.docs.map(x => x.data()) ?? [];
    console.log('Got activity:', activity);
    const daily: {[key: string]: number} = activity.reduce((res, item) =>  ({...res, ...item}), {});
    console.log('=> daily:', daily);
    const dailyActivity = Object.keys(daily).filter(key => key !== 'id').map(date => ({date: date, count: daily[date]}));
    console.log('=> daily activity:', daily);
    return dailyActivity;
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

    // Add user update to the queue (updates user info across the whole app)
    if( user.displayName !== displayName || user.photoURL !== imageUrl ) {
        await user.updateProfile({displayName: displayName, photoURL: imageUrl});
        await db.userInfoUpdate(userId).set({displayName: displayName, imageUrl: imageUrl}, {merge: true});
    }

    // Immediate update only if needed (updates are more expensive than reads)
    const userInfo = (await db.user(userId).get()).data();
    if( userInfo?.displayName !== displayName || userInfo?.imageUrl !== imageUrl )
        await db.user(userId).set({displayName: displayName, imageUrl: imageUrl}, {merge: true});
}

export const uploadProfilePicture = async (userId: string, file: File) => {
    const storage = getStorage();
    const storageRef = ref(storage, `profilePictures/${userId}/${file.name}`);
    await uploadBytesResumable(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);
    return updateUserInfo(userId, undefined, imageUrl);
}

export const uploadPicture = async (userId: string, file: File) => {
    const storage = getStorage();
    const storageRef = ref(storage, `pictures/${userId}/${file.name}`);
    await uploadBytesResumable(storageRef, file);
    return await getDownloadURL(storageRef);
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

export const hasInstructorRole = async (userId: string) => {
    const snapshot = await db.userRoles(userId).doc('instructor').get();
    console.log('roles:', snapshot.data(), snapshot, snapshot.exists);
    return snapshot.exists;
}

import firebase from 'firebase/app';
import 'firebase/firestore';
import {User} from "../models/users";
import {Course} from "../models/courses";
import { Tutorial } from '../models/tutorials';
import _ from "lodash";

// Add ids when getting the data and removing when sending it
const converter = <T>() => ({
    // @ts-ignore
    toFirestore: (data: T) => _.omit(data, 'id'),
    fromFirestore: (snap: firebase.firestore.QueryDocumentSnapshot) => Object.assign(snap.data(), {id: snap.id}) as unknown as T
});
const dataPoint = <T>(collectionPath: string) => firebase.firestore()
    .collection(collectionPath)
    .withConverter(converter<T>());


const db = {
    users: dataPoint<User>('users'),
    courses: dataPoint<Course>('courses'),
    tutorials: dataPoint<Tutorial>('tutorials'),
};

export {db}

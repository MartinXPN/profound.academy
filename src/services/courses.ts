import {db} from "./db";
import {Course} from "models/courses";
import firebase from "firebase/compat/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import {CoursePrivateFields, Insight} from "models/lib/courses";
import moment from "moment/moment";
import {dateDayDiff} from "../util";


export const onCourseChanged = (courseId: string, onChanged: (course: Course | null) => void) => {
    return db.course(courseId).onSnapshot(snapshot => onChanged(snapshot.data() ?? null));
}

export const getAllCourses = async () => {
    const snapshot = await db.courses.where('visibility', '==', 'public').get();
    const courses: Course[] = snapshot.docs.map(x => x.data());
    console.log('Got courses:', courses);
    return courses;
}

export const getCourses = async (courseIds: string[]) => {
    const courses = await Promise.all(courseIds.map(async id => (await db.course(id).get()).data() ?? null));
    const presentCourses: Course[] = courses.filter(c => !!c) as Course[];
    console.log('Got courses:', presentCourses);
    return presentCourses;
}


export const getUserCourses = async (userId: string) => {
    const snap = await db.user(userId).get();
    const us = snap.data();
    if (!us || !us.courses)
        return [];

    const courses: Course[] = await getCourses(us.courses.map(c => c.id));
    console.log('User courses:', courses);
    return courses;
}

export const getCompletedCourses = async (userId: string) => {
    const snap = await db.user(userId).get();
    const us = snap.data();
    if (!us || !us.completed)
        return [];

    const courses: Course[] = await getCourses(us.completed.map(c => c.id));
    console.log('Completed courses:', courses);
    return courses;
}

export const registerForCourse = async (userId: string, courseId: string) => {
    const course = db.course(courseId);
    const user = (await db.user(userId).get()).data();
    console.log('User:', user);
    if( user && user.courses && user.courses.length > 0 ) {
        console.log('Adding course to pre-existing list of courses');
        return await db.user(userId).update({
            courses: firebase.firestore.FieldValue.arrayUnion(course)
        });
    }

    if (!user) { // @ts-ignore
        return await db.user(userId).set({courses: [course]})
    }

    console.log('Adding courses from scratch');
    return await db.user(userId).update({
        courses: [course],
    });
}

export const doesExist = async (courseId: string) => {
    console.log('checking if', courseId, 'exists');
    try {
        const snapshot = await db.course(courseId).get();
        console.log(`${courseId} exists: ${snapshot.exists}`);
        return snapshot.exists;
    }
    catch (e) {
        console.error(e);
        return false;
    }
}

export const genCourseId = async (title: string) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789-';
    const genChar = () => chars.charAt(Math.floor(Math.random() * chars.length));
    if( title.length < 3 || title.length > 150 )
        throw Error('title should be of length [3; 150]');
    let id = title.trim().toLowerCase()
        .replaceAll(' ', '-')
        .replace(/[^0-9a-z-]/gi, '');

    while (id.length < 5)
        id += genChar();

    for( let len = 0; ; ++len ) {
        const exists = await doesExist(id);
        if( !exists )
            return id;
        if( len === 0 )
            id += '-' + genChar() + genChar();
        id += genChar();
    }
}


export const onCoursePrivateFieldsChanged = (id: string, onChanged: (privateFields: CoursePrivateFields | null) => void) => {
    return db.coursePrivateFields(id).onSnapshot(snapshot => {
        onChanged(snapshot.data() ?? null);
    })
}

export const onCourseInsightsChanged = (courseId: string, onChanged: (insights: Insight) => void) => {
    return db.courseOverallInsights(courseId).onSnapshot(snapshot => {
        const insights = snapshot.data();
        console.log('course insights changed:', insights);
        onChanged(insights ?? {runs: 0, solved: 0, submissions: 0, users: 0});
    });
}

export const onCourseHistoricalInsightsChanged = (courseId: string, start: Date, end: Date, onChanged: (insights: Insight[]) => void) => {
    const format = (date: Date) => moment(date).locale('en').format('YYYY-MM-DD');
    const startDate = format(start);
    const endDate = format(end);
    console.log('startDate:', start, startDate);
    console.log('endDate:', end, endDate);

    return db.courseInsights(courseId)
        .where('date', '>=', startDate)
        .where('date', '<', endDate)
        .onSnapshot(snapshot => {
            const insights = snapshot.docs.map(d => d.data());
            console.log('course historical insights changed:', insights);
            const res = []
            let date = start;
            while( date < end ) {
                const formattedDate = format(date);
                const insight = insights.filter(i => i.date === formattedDate);
                res.push(insight.length > 0 ? insight[0] : {date: formattedDate, runs: 0, solved: 0, submissions: 0, users: 0});
                date = dateDayDiff(date, 1);
            }
            console.log('res:', res);
            onChanged(res);
        });
}

export const searchCourses = async (title: string, limit: number = 20) => {
    const snapshot = await db.courses
        .where('visibility', 'in', ['public', 'unlisted'])
        .where('title', '>=', title.toUpperCase())
        .where('title', '<=', title.toLowerCase() + '\uf8ff')
        .limit(limit)
        .get();
    const courses = snapshot.docs.map(d => d.data());
    console.log('Found courses:', courses);
    return courses;
}


export const updateCourse = async (
    userId: string,
    id: string, img: string,
    revealsAt: Date, freezesAt: Date,
    visibility: 'public' | 'unlisted' | 'private', rankingVisibility: 'public' | 'private', allowViewingSolutions: boolean,
    title: string | {[key: string]: string}, introduction: string | {[key: string]: string},
    author: string, instructors: string[]) => {
    console.log('update course:', id, img, revealsAt, freezesAt, visibility, rankingVisibility, allowViewingSolutions);
    if( !instructors.includes(userId) ) {
        console.log('Adding the current user as an instructor as well');
        instructors.push(userId);
    }
    const exists = await doesExist(id);
    if( !exists )
        await registerForCourse(userId, id);
    await db.course(id).set({
        img: img,
        revealsAt: firebase.firestore.Timestamp.fromDate(revealsAt),
        freezeAt: firebase.firestore.Timestamp.fromDate(freezesAt),
        visibility: visibility,
        rankingVisibility: rankingVisibility,
        allowViewingSolutions: allowViewingSolutions,
        author: author,
        instructors: instructors,
        ...(!exists && {levels: [], drafts: {id: 'drafts', title: 'Drafts', score: 0, exercises: 0}}),
    }, {merge: true});

    // Update title and introduction as we don't want to merge {local: content} maps - we want to change them
    // in case we remove an element
    return await db.course(id).update({
        title: title,
        introduction: introduction,
    });
}

export const updateCoursePrivateFields = (
    id: string, invitedEmails?: string[], invitedUsers?: string[],
    mailSubject?: string, mailText?: string
) => {
    return db.coursePrivateFields(id).set({
        invitedEmails: invitedEmails,
        invitedUsers: invitedUsers,
        mailSubject: mailSubject,
        mailText: mailText,
    }, {merge: true});
}

export const sendCourseInviteEmails = async (courseId: string) => {
    const functions = getFunctions();
    const send = httpsCallable(functions, 'sendCourseInviteEmails');
    return send({
        courseId: courseId,
    });
}

import {db} from "./db";
import {Course} from "models/courses";
import firebase from "firebase/app";
import {CoursePrivateFields, Insight} from "models/lib/courses";
import moment from "moment/moment";
import {dateDayDiff} from "../util";


export const getAllCourses = async () => {
    const snapshot = await db.courses.where('visibility', '==', 'public').get();
    const courses: Course[] = snapshot.docs.map(x => x.data());
    console.log('Got courses:', courses);
    return courses;
}

export const doesExist = async (courseId: string) => {
    const snapshot = await db.course(courseId).get();
    console.log(`${courseId} exists: ${snapshot.exists}`);
    return snapshot.exists;
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

export const getCourse = async (id: string) => {
    const snapshot = await db.course(id).get();
    return snapshot.data() as Course;
}

export const getCourses = async (courseIds: string[]) => {
    const courses: Course[] = await Promise.all(courseIds.map(id => getCourse(id)));
    console.log('Got courses:', courses);
    return courses;
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
        .where('title', '>=', title.toUpperCase())
        .where('title', '<=', title.toLowerCase() + '\uf8ff')
        .limit(limit)
        .get();
    const courses = snapshot.docs.map(d => d.data());
    console.log('Found courses:', courses);
    return courses;
}

export const getUserCourses = async (userId: string) => {
    const snap = await db.user(userId).get();
    const us = snap.data();
    if (!us || !us.courses)
        return [];

    const courses: Course[] = await Promise.all(us.courses.map(x => getCourse(x.id)));
    console.log('User courses:', courses);
    return courses;
}

export const getCompletedCourses = async (userId: string) => {
    const snap = await db.user(userId).get();
    const us = snap.data();
    if (!us || !us.completed)
        return [];

    const courses: Course[] = await Promise.all(us.completed.map(x => getCourse(x.id)));
    console.log('Completed courses:', courses);
    return courses;
}

export const updateCourse = async (
    id: string, img: string,
    revealsAt: Date, freezesAt: Date,
    visibility: 'public' | 'unlisted' | 'private', rankingVisibility: 'public' | 'private', allowViewingSolutions: boolean,
    title: string, author: string, instructors: string[], introduction: string) => {
    console.log('update course:', id, img, revealsAt, freezesAt, visibility, rankingVisibility, allowViewingSolutions);
    const exists = await doesExist(id);
    return db.course(id).set({
        img: img,
        revealsAt: firebase.firestore.Timestamp.fromDate(revealsAt),
        freezeAt: firebase.firestore.Timestamp.fromDate(freezesAt),
        visibility: visibility,
        rankingVisibility: rankingVisibility,
        allowViewingSolutions: allowViewingSolutions,
        title: title,
        author: author,
        instructors: instructors,
        introduction: introduction,
        ...(!exists && {levelExercises: {'1': 0}}),
    }, {merge: true});
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
    await firebase.functions().httpsCallable('sendCourseInviteEmails')({
        courseId: courseId,
    });
}

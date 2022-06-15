import {db} from "./db";
import firebase from "firebase/compat/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import {Language} from "models/language";
import {TestCase} from "models/exercise";
import {Submission, SubmissionResult} from "models/submissions";
import {TestResult} from "models/lib/submissions";


export const submitSolution = async (userId: string,
                                     courseId: string, exerciseId: string,
                                     code: string, language: Language,
                                     isTestRun: boolean, testCases?: TestCase[]) => {
    const extension = language.extension;
    const projectCode = {[`main.${extension}`]: code};

    const courseRef = db.courses.doc(courseId);
    const exerciseRef = db.exercises(courseId).doc(exerciseId);
    // @ts-ignore
    const submission = {
        id: '',
        userId: userId,
        course: courseRef,
        exercise: exerciseRef,
        testCases: testCases,
        code: projectCode,
        language: language.languageCode,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isTestRun: isTestRun,
    } as Submission;

    const snapshot = await db.submissionQueue(userId).add(submission);
    console.log('submit document result:', snapshot);
    return snapshot.id;
}

export const onRunResultChanged = (userId: string, submissionId: string,
                                   onChanged: (submissionResult: SubmissionResult | null) => void) => {
    return db.run(userId, submissionId).onSnapshot(doc => {
        const res = doc.data();
        console.log('Run result changed:', submissionId, res);
        onChanged(res ?? null);
    });
}


export const onSubmissionResultChanged = (userId: string, submissionId: string,
                                          onChanged: (submissionResult: SubmissionResult | null) => void) => {
    return db.submissionResult(submissionId).onSnapshot(doc => {
        const res = doc.data();
        console.log('Submission result changed:', submissionId, res);
        onChanged(res ?? null);
    });
}

export const onRunTestResultsChanged = (userId: string, submissionId: string,
                                        onChanged: (testResults: TestResult[] | null) => void) => {
    return db.runTestResults(userId, submissionId).onSnapshot(snapshot => {
        const res = snapshot.data();
        console.log('Run test results changed:', submissionId, res);
        onChanged(res?.testResults ?? null);
    });
}

export const onSubmissionTestResultsChanged = (userId: string, submissionId: string,
                                               onChanged: (testResults: TestResult[] | null) => void) => {
    return db.submissionTestResults(userId, submissionId).onSnapshot(snapshot => {
        const res = snapshot.data();
        console.log('Run test results changed:', submissionId, res);
        onChanged(res?.testResults ?? null);
    });
}


const submissionQuery = async (query: firebase.firestore.Query<SubmissionResult>, startAfterId: string | null, numItems: number) => {
    if( startAfterId ) {
        const startAfterSubmission = await db.submissionResult(startAfterId).get();
        query = query.startAfter(startAfterSubmission);
        query = query.limit(numItems);
    }
    else {
        const endAt = (await query.limit(numItems).get()).docs.at(-1)?.id;
        if( endAt ) {
            const endAtSubmission = await db.submissionResult(endAt).get();
            query = query.endAt(endAtSubmission);
        }
        else {
            query = query.limit(numItems);
        }
    }
    return query;
};

export const onSubmissionsChanged = async (
    courseId: string, exerciseId: string, userId: string, mode: 'all' | 'best' | 'my',
    startAfterId: string | null, numItems: number,
    onChanged: (submissionResult: SubmissionResult[], hasMore: boolean) => void
) => {
    const exercise = db.exercise(courseId, exerciseId);
    let query = db.submissionResults
        .where('exercise', '==', exercise);
    if( mode === 'all' )
        query = query.orderBy('createdAt', 'desc');
    else if( mode === 'best' )
        query = query.where('isBest', '==', true)
            .where('status', '==', 'Solved')
            .orderBy('score', 'desc')
            .orderBy('time', 'asc')
            .orderBy('memory', 'asc');
    else
        query = query.where('userId', '==', userId)
            .orderBy('createdAt', 'desc');

    console.log('startAfterId:', startAfterId);
    query = await submissionQuery(query, startAfterId, numItems);

    return query.onSnapshot(snapshot => {
        const submissions: SubmissionResult[] = snapshot.docs.map(d => d.data());
        console.log('Got submissions for exercise:', exerciseId, submissions);
        onChanged(submissions, submissions.length >= numItems);
    });
}

export const onCourseSubmissionsChanged = async (courseId: string,
                                           startAfterId: string | null, numItems: number,
                                           onChanged: (submissionResult: SubmissionResult[], hasMore: boolean) => void) => {
    const course = db.course(courseId);
    let query = db.submissionResults
        .where('course', '==', course)
        .orderBy('createdAt', 'desc');

    console.log('startAfterId:', startAfterId);
    query = await submissionQuery(query, startAfterId, numItems);

    return query.onSnapshot(snapshot => {
        const submissions: SubmissionResult[] = snapshot.docs.map(d => d.data());
        console.log('Got submissions for course:', courseId, submissions);
        onChanged(submissions, submissions.length >= numItems);
    });
}

export const onUserSubmissionsChanged = async (
    userId: string,
    startAfterId: string | null, numItems: number,
    onChanged: (submissionResult: SubmissionResult[], hasMore: boolean) => void,
    startDate?: Date, endDate?: Date, direction?: 'desc' | 'asc',
) => {
    let query = db.submissionResults.where('userId', '==', userId);
    if( startDate && endDate )
        query = query.where('createdAt', '>', firebase.firestore.Timestamp.fromDate(startDate))
            .where('createdAt', '<', firebase.firestore.Timestamp.fromDate(endDate))
    query = query.orderBy('createdAt', direction ?? 'desc');

    console.log('startAfterId:', startAfterId);
    query = await submissionQuery(query, startAfterId, numItems);

    return query.onSnapshot(snapshot => {
        const submissions: SubmissionResult[] = snapshot.docs.map(d => d.data());
        console.log('Got submissions user:', userId, submissions);
        onChanged(submissions, submissions.length >= numItems);
    });
}

export const onUserExerciseSubmissionsChanged = async (
    userId: string, courseId: string, exerciseId: string, direction: 'desc' | 'asc',
    startAfterId: string | null, numItems: number,
    onChanged: (submissionResult: SubmissionResult[], hasMore: boolean) => void,
) => {
    console.log('getting user-exercise submission with:', userId, courseId, exerciseId, direction);
    const exerciseRef = db.exercises(courseId).doc(exerciseId);
    let query = db.submissionResults
        .where('userId', '==', userId)
        .where('exercise', '==', exerciseRef)
        .orderBy('createdAt', direction ?? 'desc');

    console.log('startAfterId:', startAfterId);
    query = await submissionQuery(query, startAfterId, numItems);

    return query.onSnapshot(snapshot => {
        const submissions: SubmissionResult[] = snapshot.docs.map(d => d.data());
        console.log('Got submissions user:', userId, submissions);
        onChanged(submissions, submissions.length >= numItems);
    });
}


export const getSubmissionCode = async (userId: string, submissionId: string) => {
    const snapshot = await db.submissionSensitiveRecords(userId, submissionId).get();
    const records = snapshot.data();

    if( !records )
        throw Error('The record does not exist!');
    return records.code;
}

export const reEvaluateSubmissions = async (courseId: string, exerciseId: string) => {
    console.log('re-evaluating all the submissions...:', courseId, exerciseId);
    const functions = getFunctions();
    const reEvaluate = httpsCallable(functions, 'reEvaluateSubmissions');
    return reEvaluate({
        courseId: courseId,
        exerciseId: exerciseId,
    });
}

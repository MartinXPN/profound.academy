import {ExerciseProgress, Progress} from "models/courses";
import {db} from "./db";
import {SubmissionStatus} from "models/submissions";

export const onProgressChanged = (courseId: string, metric: string, onChanged: (progress: Progress[]) => void ) => {

    return db.progress(courseId).orderBy(metric, 'desc').onSnapshot(snapshot => {
        const res = snapshot.docs.map(d => d.data());
        console.log(`${metric} - progress changed:`, res);
        onChanged(res ?? []);
    })
}

export const onUserProgressChanged = (courseId: string, userId: string, onChanged: (progress: Progress | null) => void) => {
    return db.userProgress(courseId, userId).onSnapshot(snapshot => {
        const res = snapshot.data();
        console.log('User progress updated:', res);
        onChanged(res ?? null);
    });
}

export const onLevelExerciseProgressChanged = <T>(courseId: string, level: string,
                                                  metric: string,
                                                  onChanged: (userIdToProgress: { [key: string]: { [key: string]: T } }) => void) => {
    if( !metric.startsWith('exercise') )
        throw Error(`Invalid metric provided: ${metric}`);
    return db.levelExerciseProgress(courseId, level, metric).onSnapshot(snapshot => {
        // @ts-ignore
        const res: ExerciseProgress<T>[] = snapshot.docs.map(d => d.data());
        console.log('Level progress updated:', res);
        const userIdToProgress = res.reduce((obj, item) => {
            return {...obj, [item.userId]: item.progress}
        }, {});
        console.log(userIdToProgress);
        onChanged(userIdToProgress);
    })
}


export const onCourseExerciseProgressChanged = (courseId: string,
                                                userId: string,
                                                level: string,
                                                onChanged: (progress: ExerciseProgress<SubmissionStatus> | null) => void) => {
    return db.courseExerciseProgress(courseId, userId, level).onSnapshot(snapshot => {
        const res = snapshot.data();
        console.log('Exercise Progress for level', level, ':', res);
        onChanged(res ?? null);
    });
}

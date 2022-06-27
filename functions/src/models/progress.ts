import {SubmissionStatus} from './submissions';


export interface ExerciseProgress<T> {
    id: string;                                 // level
    courseId: string;                           // courseId to be able to query by collectionGroup
    userId: string;                             // userId to be able to query by collectionGroup
    level: string;                              // level again
    progress: { [key: string]: T };             // {exId: score | 'Solved'}
}

/**
 * Progress of the user for the course
 */
export interface Progress {
    id: string;                                             // userId
    userId: string;                                         // userId for collection group queries
    userDisplayName: string;                                // how to show the user
    userImageUrl?: string;                                  // Image of the user

    score?: number;                                         // total score for the course
    levelScore?: { [key: string]: number };                 // {levelId: score}
    exerciseScore?: ExerciseProgress<number>;               // [sub-collection] progress = {exId: score}

    upsolveScore?: number;                                  // total score for the course (after the freeze)
    levelUpsolveScore?: { [key: string]: number };          // {levelId: score}
    exerciseUpsolveScore?: ExerciseProgress<number>;        // [sub-collection] progress = {exId: score}

    solved?: number;                                        // total solved exercises
    levelSolved?: { [key: string]: number };                // {levelId: #solved}
    exerciseSolved?: ExerciseProgress<SubmissionStatus>;    // [sub-collection] progress = {exId: status}
}

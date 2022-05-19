import {SubmissionStatus} from './submissions';


export interface ExerciseProgress<T> {
    id: string;                                 // level
    courseId: string;                           // courseId to be able to query by collectionGroup
    userId: string;                             // userId to be able to query by collectionGroup
    level: string;                              // level again
    progress: { [key: string]: T };             // {exId: score | 'Solved'}
}

export interface Progress {
    id: string;                                             // userId
    userId: string;                                         // userId for collction group queries
    userDisplayName: string;                                // how to show the user
    userImageUrl?: string;                                  // Image of the user
    score?: number;                                         // total score for the course
    upsolveScore?: number;                                  // total score for the course (after the freeze)
    levelScore?: { [key: string]: number };                 // {level: score}
    levelUpsolveScore?: { [key: string]: number };          // {level: score}
    exerciseScore?: ExerciseProgress<number>;               // [subcollection] progress = {exId: score}
    exerciseUpsolveScore?: ExerciseProgress<number>;        // [subcollection] progress = {exId: score}

    solved?: number;                                        // total solved exercises
    levelSolved?: { [key: string]: number };                // {level: #solved}
    exerciseSolved?: ExerciseProgress<SubmissionStatus>;    // [subcollection] progress = {exId: status}
}

import firebase from "firebase/app";

import {db} from "./db";
import {Comment} from '../models/forum';
import {Exercise} from "../models/courses";


export const onExerciseCommentsChanged = (courseId: string,
                                          exerciseId: string,
                                          onChanged: (comments: Comment[] | undefined) => void) => {
    const exercise = db.exercise(courseId, exerciseId);
    return db.forum
        .where('repliedTo', '==', exercise)
        .orderBy('createdAt', 'asc')
        .onSnapshot(snapshot => {
            const comments: Comment[] = snapshot.docs.map(x => x.data());
            console.log('comments:', comments);
            onChanged(comments);
        });
};

export const onCommentRepliesChanged = (commentId: string,
                                        onChanged: (comments: Comment[] | undefined) => void) => {
    const comment = db.forumComment(commentId);
    return db.forum
        .where('repliedTo', '==', comment)
        .orderBy('createdAt', 'asc')
        .onSnapshot(snapshot => {
            const comments: Comment[] = snapshot.docs.map(x => x.data());
            console.log('replies:', comments);
            onChanged(comments);
        });
};

export const saveComment = async (courseId: string, exerciseId: string,
                                  userId: string, displayName: string, avatarUrl: string | null,
                                  text: string) => {
    // @ts-ignore
    const exercise = db.exercise(courseId, exerciseId) as Exercise;
    const comment: Comment = {
        id: '-1',
        userId: userId,
        displayName: displayName,
        avatarUrl: avatarUrl ?? undefined,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        repliedTo: exercise,
        replies: [],
        score: 1,
        text: text,
    }
    return await db.forum.add(comment);
};

export const saveReply = async (commentId: string,
                                userId: string, displayName: string, avatarUrl: string | null,
                                text: string) => {
    // @ts-ignore
    const comment = db.forumComment(commentId) as Comment;
    const reply: Comment = {
        id: '-1',
        userId: userId,
        displayName: displayName,
        avatarUrl: avatarUrl ?? undefined,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        repliedTo: comment,
        replies: [],
        score: 1,
        text: text,
    }

    const ref = await db.forum.add(reply);
    console.log('Saved the reply:', ref);
    console.log('Adding to replies of:', commentId);

    // update the comment as well
    return await db.forumComment(commentId).update({
        replies: firebase.firestore.FieldValue.arrayUnion(ref),
    });
};

export const updateComment = async (commentId: string, text: string) => {
    return await db.forumComment(commentId).update({
        text: text,
    });
};

import firebase from "firebase/app";

import {db} from "./db";
import {Comment} from 'models/forum';


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

export const getCommentReplies = async (commentId: string) => {
    const comment = db.forumComment(commentId);
    const snapshot = await db.forum
        .where('repliedTo', '==', comment)
        .orderBy('createdAt', 'asc').get();
    const replies = snapshot.docs.map(r => r.data());
    console.log('replies:', replies);
    return replies;
};

export const saveComment = async (courseId: string, exerciseId: string,
                                  userId: string, displayName: string, avatarUrl: string | null,
                                  text: string) => {
    const exercise = db.exercise(courseId, exerciseId);
    const comment: Comment = {
        id: '-1',
        userId: userId,
        displayName: displayName,
        avatarUrl: avatarUrl ?? undefined,
        createdAt: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
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
    const comment = db.forumComment(commentId);
    const reply: Comment = {
        id: '-1',
        userId: userId,
        displayName: displayName,
        avatarUrl: avatarUrl ?? undefined,
        createdAt: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
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

export const deleteComment = async (commentId: string) => {
    return await db.forumComment(commentId).delete();
}

export const vote = async (commentId: string, userId: string, vote: number) => {
    if (![-1, 0, 1].includes(vote)) {
        throw RangeError(`${vote} is not in the right range`);
    }

    const commentRef = db.forumComment(commentId);
    const votersRef = db.forumCommentVotes(commentId, userId);
    const userVoteRef = db.userVotes(commentId, userId);

    return await firebase.firestore().runTransaction(async transaction => {
        const voter = await transaction.get(votersRef);
        let currentVote = voter.exists && voter.data() ? voter.data()?.vote : 0;
        currentVote = currentVote || 0;
        console.log('currentVote:', currentVote, 'vote:', vote);
        if( currentVote === vote )
            return;

        transaction.update(commentRef, {score: firebase.firestore.FieldValue.increment(-currentVote)});
        transaction.update(commentRef, {score: firebase.firestore.FieldValue.increment(vote)});
        transaction.set(votersRef, {vote: vote});
        transaction.set(userVoteRef, {vote: vote});
    });
}

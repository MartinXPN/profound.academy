import React, {useCallback, useContext, useEffect, useState} from "react";
import { Button, Divider, List, TextField, Typography } from "@mui/material";
import {onExerciseCommentsChanged, saveComment} from "../../services/forum";
import {Comment} from '../../models/forum';
import CommentView from "./CommentView";
import {AuthContext} from "../../App";
import { styled } from '@mui/material/styles';
import {CourseContext, CurrentExerciseContext} from "../Course";


const RootContainer = styled('div')(({theme}) => ({
    margin: theme.spacing(4),
}));


function Forum() {
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);

    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState<Comment[]>([]);

    const onAskQuestion = useCallback(async () => {
        if( !course?.id || !exercise?.id )
            return;

        if( !auth.currentUserId || !auth.currentUser || !auth.currentUser.displayName)
            return;
        await saveComment(course.id, exercise.id, auth.currentUserId, auth.currentUser.displayName, auth?.currentUser?.photoURL, newComment);
        setNewComment('');
    }, [auth.currentUser, auth.currentUserId, course?.id, exercise?.id, newComment]);

    useEffect(() => {
        if( !course?.id || !exercise?.id ) {
            setComments([]);
            return;
        }

        return onExerciseCommentsChanged(course.id, exercise.id, (comments) => {
            console.log('got comments in the forum:', comments);
            if (comments)
                setComments(comments);
        });
    }, [course?.id, exercise?.id]);


    return (
        <RootContainer>
            <Typography variant='h5'>Ask & answer questions</Typography>
            <List>
                {comments.map(c => <CommentView comment={c} key={c.id} allowReply={true}/>)}
                <Divider/>

                {auth && auth.currentUser && auth.currentUser.displayName && auth.currentUser.uid &&
                <>
                    <TextField required multiline fullWidth
                               variant="standard"
                               placeholder="Start typing here..."
                               onChange={event => setNewComment(event.target.value)}
                               value={newComment}
                               InputProps={{ disableUnderline: true }} />
                    {newComment && <Button size="small" variant="contained" color="primary" onClick={onAskQuestion}>
                        Ask a question
                    </Button>}
                </>}
            </List>
        </RootContainer>
    );
}

export default Forum;

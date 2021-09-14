import React, {useContext, useEffect, useState} from "react";
import {Button, createStyles, Divider, List, makeStyles, TextField, Theme, Typography} from "@material-ui/core";
import {Course, Exercise} from "../../models/courses";
import {onExerciseCommentsChanged, saveComment} from "../../services/forum";
import {Comment} from '../../models/forum';
import CommentView from "./CommentView";
import {AuthContext} from "../../App";


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            margin: theme.spacing(4),
        }
    }),
);


interface ForumProps {
    course: Course;
    exercise: Exercise;
}

function Forum(props: ForumProps) {
    const classes = useStyles();
    const auth = useContext(AuthContext);
    const {course, exercise} = props;
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState<Comment[]>([]);

    const onAskQuestion = async () => {
        if( !auth || !auth.currentUser || !auth.currentUser.uid || !auth.currentUser.displayName)
            return;
        await saveComment(course.id, exercise.id, auth.currentUser.uid, auth.currentUser.displayName, auth?.currentUser?.photoURL, newComment);
        setNewComment('');
    };

    useEffect(() => {
        const unsubscribe = onExerciseCommentsChanged(course.id, exercise.id, (comments) => {
            console.log('got comments in the forum:', comments);
            if (comments)
                setComments(comments);
        });

        return () => unsubscribe();
    }, [course.id, exercise.id]);


    return (
        <div className={classes.root}>
            <Typography variant='h5'>Ask & answer questions</Typography>
            <List>
                {comments.map(c => <CommentView comment={c} key={c.id} allowReply={true}/>)}
                <Divider/>

                {auth && auth.currentUser && auth.currentUser.displayName && auth.currentUser.uid &&
                <>
                    <TextField required multiline fullWidth
                               placeholder="Start typing here..."
                               onChange={event => setNewComment(event.target.value)}
                               value={newComment}
                               InputProps={{ disableUnderline: true }} />
                    {newComment && <Button size="small" variant="contained" color="primary" onClick={onAskQuestion}>
                        Ask a question
                    </Button>}
                </>}
            </List>
        </div>
    );
}

export default Forum;

import React, {useState} from "react";
import {createStyles, List, makeStyles, Theme, Typography} from "@material-ui/core";
import {Course, Exercise} from "../../models/courses";
import useAsyncEffect from "use-async-effect";
import {getExerciseComments} from "../../services/forum";
import {Comment} from '../../models/forum';
import CommentView from "./CommentView";


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
    const {course, exercise} = props;
    const [comments, setComments] = useState<Comment[]>([]);

    useAsyncEffect(async () => {
        const comments = await getExerciseComments(course.id, exercise.id);
        console.log('got comments in the forum:', comments);
        setComments(comments);
    }, [course, exercise]);

    return (
        <div className={classes.root}>
            <Typography variant='h5'>Ask & answer questions</Typography>
            <List>
                {comments.map(c => <CommentView comment={c} key={c.id}/>)}
            </List>
        </div>
    );
}

export default Forum;

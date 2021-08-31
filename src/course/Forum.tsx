import React from "react";
import {createStyles, makeStyles, Theme, Typography} from "@material-ui/core";
import {Course, Exercise} from "../models/courses";

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
    console.log('Forum for course:', course, 'exercise', exercise);

    return (
        <div className={classes.root}>
            <Typography variant='h5'>The forum will appear here...</Typography>
        </div>
    );
}

export default Forum;

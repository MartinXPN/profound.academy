import Content from "./content/Content";
import React, {useState} from "react";
import Button from "@material-ui/core/Button";
import {createStyles, makeStyles, Theme} from "@material-ui/core";
import {Course, Exercise} from "../models/courses";
import SubmissionsTable from "./SubmissionsTable";
import Forum from "./Forum";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        tabChooser: {
            textAlign: 'center',
            padding: '10px'
        },
        button: {
            margin: theme.spacing(1),
            borderRadius: 50,
            size: 'large',
        },
    }),
);



interface ExerciseProps {
    course: Course;
    exercise: Exercise;
}

function ExerciseView(props: ExerciseProps) {
    const classes = useStyles();

    const {course, exercise} = props;
    const [currentTab, setCurrentTab] = useState('description'); // {description / allSubmissions / bestSubmissions}
    console.log('ExerciseView:', exercise);

    return (
        <>
            <div className={classes.tabChooser}>
                <Button className={classes.button} variant={currentTab === 'description' ? 'contained' : 'outlined'} onClick={() => setCurrentTab('description')}>Description</Button>
                <Button className={classes.button} variant={currentTab === 'bestSubmissions' ? 'contained' : 'outlined'} onClick={() => setCurrentTab('bestSubmissions')}>Best Submissions</Button>
                <Button className={classes.button} variant={currentTab === 'allSubmissions' ? 'contained' : 'outlined'} onClick={() => setCurrentTab('allSubmissions')}>All Submissions</Button>
            </div>


            {currentTab === 'description' && <Content notionPage={exercise.pageId}/>}
            {currentTab === 'bestSubmissions' && <SubmissionsTable course={course} exercise={exercise} mode="best" />}
            {currentTab === 'allSubmissions' && <SubmissionsTable course={course} exercise={exercise} mode="all" />}

            <Forum course={course} exercise={exercise} />
        </>
    );
}

export default ExerciseView;

import React, {createContext, useContext, useEffect, useState} from "react";
import {Route, Switch, useHistory, useParams, useRouteMatch} from "react-router-dom";

import { Theme } from '@mui/material/styles';

import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';

import {getCourse} from "../services/courses";
import useAsyncEffect from "use-async-effect";
import {Course, Exercise} from "../models/courses";
import {AuthContext} from "../App";
import {getCourseExercises} from "../services/courses";
import CourseDrawer from "./drawer/Drawer";
import CurrentExercise from "./CurrentExercise";


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            display: 'flex',
            height: 'calc(100vh - 64px)',
        },
        toolbar: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: theme.spacing(0, 1),
            // necessary for content to be below app bar
            ...theme.mixins.toolbar,
        },
        content: {
            flexGrow: 1,
            padding: theme.spacing(0),
        },
    }),
);

export const CourseContext = createContext<{ course: Course | null }>({course: null});

function CourseView() {
    const classes = useStyles();
    const auth = useContext(AuthContext);
    const history = useHistory();
    let match = useRouteMatch();
    const {courseId} = useParams<{ courseId: string }>();

    const [course, setCourse] = useState<Course | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [idToExercise, setIdToExercise] = useState<{}>({});
    const [showRanking, setShowRanking] = useState<boolean>(false);

    const openExercise = (exerciseId: string) => {
        const url = match.url.replace(/\/$/, '');
        history.push(`${url}/${exerciseId}`);
    };
    const openRanking = () => {
        const url = match.url.replace(/\/$/, '');
        history.push(`${url}/ranking`);
    };
    const launchCourse = () => {
        exercises.length > 0 && openExercise(exercises[0].id);
    };

    useAsyncEffect(async () => {
        const course = await getCourse(courseId);
        setCourse(course);
    }, [courseId, auth]);

    useAsyncEffect(async () => {
        const exercises = await getCourseExercises(courseId);
        const idToExercise = exercises.reduce((newObj, x) => ({...newObj, [x.id]: x}), {});
        setExercises(exercises);
        setIdToExercise(idToExercise);
    }, [courseId]);


    useEffect(() => {
        if( !auth.currentUserId || !course ) {
            setShowRanking(false);
            return;
        }

        if (course.instructors.includes(auth.currentUserId) || course.rankingVisibility === 'public' )
            setShowRanking(true);

    }, [course, auth]);


    return (
        <Switch>
        <CourseContext.Provider value={{course: course}}>
        <div className={classes.root}>
            <Route path={`${match.path}/:exerciseId?`}>
                <CourseDrawer
                    exercises={exercises}
                    onItemSelected={openExercise}
                    showRanking={showRanking}
                    onRankingClicked={openRanking} />

                <main className={classes.content}>
                    <div className={classes.toolbar}/>
                    {course && <CurrentExercise
                        idToExercise={idToExercise}
                        launchCourse={launchCourse}/>}
                </main>
            </Route>
        </div>
        </CourseContext.Provider>
        </Switch>
    );
}

export default CourseView;

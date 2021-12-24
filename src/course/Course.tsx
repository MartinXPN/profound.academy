import React, {createContext, useCallback, useContext, useEffect, useState} from "react";
import {Route, Switch, useHistory, useParams, useRouteMatch} from "react-router-dom";

import { Theme } from '@mui/material/styles';

import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';

import {getCourse, getExercise, getFirstExercise} from "../services/courses";
import useAsyncEffect from "use-async-effect";
import {Course, Exercise as ExerciseModel} from "../models/courses";
import {AuthContext} from "../App";
import CourseDrawer from "./drawer/Drawer";
import Exercise from "./Exercise";
import {useStickyState} from "../util";


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
export const CurrentExerciseContext = createContext<{ exercise: ExerciseModel | null }>({exercise: null});


function CurrentCourseView({openPage}: {openPage: (page: string) => void}) {
    const classes = useStyles();
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const [showRanking, setShowRanking] = useState<boolean>(false);

    const {exerciseId} = useParams<{ exerciseId: string }>();
    const [currentExercise, setCurrentExercise] = useState<ExerciseModel | null>(null);
    const [currentExerciseId, setCurrentExerciseId] = useStickyState<string>('', `ex-${auth?.currentUserId}-${course?.id}`);

    const openExercise = useCallback((exercise: ExerciseModel) => {
        setCurrentExercise(exercise);
        openPage(exercise.id);
    }, [openPage]);
    const openRanking = useCallback(() => openPage('ranking'), [openPage]);
    const launchCourse = useCallback(async () => {
        console.log('Launching the course!');
        if( course ) {
            const firstExercise = await getFirstExercise(course.id);
            if( firstExercise )
                openPage(firstExercise.id);
        }
    }, [course, openPage]);

    if( exerciseId && currentExerciseId !== exerciseId ) {
        setCurrentExerciseId(exerciseId);
    }
    else if (currentExerciseId && !exerciseId ) {
        openPage(currentExerciseId);
    }

    useEffect(() => {
        if( !auth.currentUserId || !course ) {
            setShowRanking(false);
            return;
        }

        if (course.instructors.includes(auth.currentUserId) || course.rankingVisibility === 'public' )
            setShowRanking(true);
    }, [course, auth]);

    useAsyncEffect(async () => {
        if( !course || !currentExerciseId )
            return;
        if( currentExercise && currentExercise.id === currentExerciseId ) {
            console.log('Not loading the exercise as it is already the current one', currentExercise.id, currentExerciseId, currentExercise);
            return;
        }

        const ex = await getExercise(course.id, currentExerciseId);
        console.log('Updating current exercise to:', ex);
        setCurrentExercise(ex);
    }, [currentExerciseId, currentExercise, course]);

    return <>
        <CurrentExerciseContext.Provider value={{exercise: currentExercise}}>
            <CourseDrawer
                onItemSelected={openExercise}
                showRanking={showRanking}
                onRankingClicked={openRanking} />

            <main className={classes.content}>
                <div className={classes.toolbar}/>
                <Exercise launchCourse={launchCourse}/>
            </main>
        </CurrentExerciseContext.Provider>
    </>
}


function CourseView() {
    const classes = useStyles();
    const auth = useContext(AuthContext);
    const history = useHistory();
    const match = useRouteMatch();
    const {courseId} = useParams<{ courseId: string }>();
    const [course, setCourse] = useState<Course | null>(null);

    useAsyncEffect(async () => {
        const course = await getCourse(courseId);
        setCourse(course);
    }, [courseId, auth]);

    const openPage = useCallback((pageId: string) => {
        const url = match.url.replace(/\/$/, '');
        history.push(`${url}/${pageId}`);
    }, [history, match.url]);

    if( !course )
        return <></>
    return (
        <CourseContext.Provider value={{course: course}}>
        <Switch>
            <Route path={`${match.path}/:exerciseId?`}>

            <div className={classes.root}>
                <CurrentCourseView openPage={openPage} />
            </div>
            </Route>
        </Switch>
        </CourseContext.Provider>
    );
}

export default CourseView;

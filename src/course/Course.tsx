import React, {useContext, useEffect, useState} from "react";
import {Route, Switch, useHistory, useParams, useRouteMatch} from "react-router-dom";
import SplitPane from 'react-split-pane';

import { Theme } from '@mui/material/styles';

import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';

import {getCourse, startCourse} from "../services/courses";
import useAsyncEffect from "use-async-effect";
import {Course, Exercise} from "../models/courses";
import LandingPage from "./LandingPage";
import {AuthContext} from "../App";
import {getCourseExercises} from "../services/courses";
import Editor from "./editor/Editor";
import ExerciseView from "./Exercise";
import {SignIn} from "../header/Auth";
import {useStickyState} from "../util";
import CourseDrawer from "./Drawer";
import {onUserProgressUpdated} from "../services/users";
import {Progress} from "../models/users";
import RankingTable from "./RankingTable";


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
        landingPage: {
            paddingBottom: '12em',
        },
        exercise: {
            overflowY: 'auto',
            height: '100%',
        }
    }),
);


function CurrentExercise({course, idToExercise, launchCourse}:
                         {course: Course, idToExercise: {[key: string]: Exercise}, launchCourse: () => void}) {
    const classes = useStyles();
    const history = useHistory();
    let match = useRouteMatch();
    const auth = useContext(AuthContext);

    // exercise management - sync localStorage with the URL
    const [currentExerciseId, setCurrentExerciseId] = useStickyState<string>('', `ex-${auth?.currentUser?.uid}-${course.id}`);
    const {exerciseId} = useParams<{ exerciseId: string }>();
    if( exerciseId && currentExerciseId !== exerciseId ) {
        setCurrentExerciseId(exerciseId);
    }
    else if (currentExerciseId && !exerciseId ) {
        const url = match.url.replace(/\/$/, '');
        history.push(`${url}/${currentExerciseId}`);
    }

    const [exercise, setExercise] = useState<Exercise | undefined>(undefined);
    const [showSignIn, setShowSignIn] = useState(false);
    const [splitPos, setSplitPos] = useStickyState(50, `splitPos-${auth?.currentUser?.uid}`);

    useAsyncEffect(async () => {
        idToExercise.hasOwnProperty(currentExerciseId) && setExercise(idToExercise[currentExerciseId]);
    }, [idToExercise, currentExerciseId]);

    if(auth?.isSignedIn && showSignIn)
        setShowSignIn(false);

    return (
        <>
            {/* Display the landing page with an option to start the course if it wasn't started yet */
            (!exercise || !auth?.isSignedIn) &&
            <div className={classes.landingPage}>
                <LandingPage course={course} introPageId={course.introduction} onStartCourseClicked={async () => {
                    if (auth && auth.currentUser && auth.currentUser.uid) {
                        await startCourse(auth.currentUser.uid, course.id);
                        launchCourse();
                    } else {
                        setShowSignIn(true);
                    }
                }}/>

                {/* Request for authentication if the user is not signed-in yet */
                    showSignIn && <SignIn />
                }
            </div>
            }

            {/* Display the exercise of the course at the location where it was left off the last time*/
            exercise && auth?.isSignedIn && !showSignIn &&
            <SplitPane split='vertical' defaultSize={splitPos} onChange={setSplitPos}>
                <div className={classes.exercise}>
                    {exerciseId === 'ranking' ?
                        <RankingTable course={course} /> :
                        <ExerciseView course={course} exercise={exercise}/>}
                </div>
                <div style={{width: '100%', height: '100%'}}><Editor course={course} exercise={exercise}/></div>
            </SplitPane>
            }
        </>
    )
}


function CourseView() {
    const classes = useStyles();
    const auth = useContext(AuthContext);
    const history = useHistory();
    let match = useRouteMatch();
    const {courseId} = useParams<{ courseId: string }>();

    const [course, setCourse] = useState<Course | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [idToExercise, setIdToExercise] = useState<{}>({});
    const [progress, setProgress] = useState<{[key: string]: Progress}>({});

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
        const idToExercise = exercises.reduce((newObj, x) => ({...newObj, [x.id]: x}), {})
        setExercises(exercises);
        setIdToExercise(idToExercise);
    }, [courseId]);

    useEffect(() => {
        if( !auth || !auth.currentUser || !auth.currentUser.uid )
            return;

        const unsubscribe = onUserProgressUpdated(auth.currentUser.uid, courseId, setProgress);
        return () => unsubscribe();
    }, [courseId, auth]);


    return (
        <Switch>
        <div className={classes.root}>
            <Route path={`${match.path}/:exerciseId?`}>
                <CourseDrawer exercises={exercises}
                      progress={progress}
                      onItemSelected={openExercise}
                      showRanking={course?.rankingVisibility === 'public'}
                      onRankingClicked={openRanking} />

                <main className={classes.content}>
                    <div className={classes.toolbar}/>
                    {course && <CurrentExercise course={course} idToExercise={idToExercise} launchCourse={launchCourse}/>}
                </main>
            </Route>
        </div>
        </Switch>
    );
}

export default CourseView;

import React, {useContext, useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import SplitPane from 'react-split-pane';

import {createStyles, makeStyles, Theme} from '@material-ui/core/styles';

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
        exerciseRoot: {
            paddingBottom: '12em',
        },
        exercise: {
            overflowY: 'auto',
            height: '100%',
        }
    }),
);


interface ExerciseProps {
    course: Course;
    exercise: Exercise | null;
    launchCourse: () => void;
}

function CurrentExercise(props: ExerciseProps) {
    const classes = useStyles();
    const auth = useContext(AuthContext);
    const [showSignIn, setShowSignIn] = useState(false);
    const {course, exercise, launchCourse} = props;
    const [splitPos, setSplitPos] = useStickyState(50, `splitPos-${auth?.currentUser?.uid}`);

    if(auth?.isSignedIn && showSignIn)
        setShowSignIn(false);

    return (
        <div className={classes.exerciseRoot}>
            {/* Display the landing page with an option to start the course if it wasn't started yet */
            (!exercise || !auth?.isSignedIn) &&
            <LandingPage introPageId={course.introduction} onStartCourseClicked={() => {
                if (auth && auth.currentUser && auth.currentUser.uid) {
                    startCourse(auth.currentUser.uid, course.id).then(() => console.log('success'));
                    launchCourse();
                } else {
                    setShowSignIn(true);
                }
            }}/>
            }

            {/* Request for authentication if the user is not signed-in yet */
                showSignIn && <SignIn />
            }

            {/* Display the exercise of the course at the location where it was left off the last time*/
            exercise && auth?.isSignedIn && !showSignIn &&
            <SplitPane split='vertical' defaultSize={splitPos} onChange={setSplitPos}>
                <div className={classes.exercise}>
                    <ExerciseView course={course} exercise={exercise}/>
                </div>
                <div style={{width: '100%', height: '100%'}}><Editor course={course} exercise={exercise}/></div>
            </SplitPane>
            }
        </div>
    )
}

interface CourseParams {
    id: string;
}

function CourseView() {
    const classes = useStyles();
    const {id} = useParams<CourseParams>();
    const auth = useContext(AuthContext);

    const [course, setCourse] = useState<Course | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [progress, setProgress] = useState<{[key: string]: Progress}>({});
    const [pageId, setPageId] = useStickyState(-1, `page-${auth?.currentUser?.uid}-${id}`);

    const launchCourse = () => setPageId(0);
    const currentExercise = course && pageId >= 0 && exercises && exercises[parseInt(pageId)] ? exercises[parseInt(pageId)] : null;

    useAsyncEffect(async () => {
        const course = await getCourse(id);
        setCourse(course);
    }, [id, auth]);

    useAsyncEffect(async () => {
        const exercises = await getCourseExercises(id);
        setExercises(exercises);
    }, [id]);

    useEffect(() => {
        if( !auth || !auth.currentUser || !auth.currentUser.uid )
            return;

        const unsubscribe = onUserProgressUpdated(auth.currentUser.uid, id, setProgress);
        return () => unsubscribe();
    }, [id, auth]);


    return (<>
        <div className={classes.root}>
            <CourseDrawer exercises={exercises}
                          progress={progress}
                          currentExerciseId={currentExercise?.id}
                          onItemSelected={setPageId} />

            <main className={classes.content}>
                <div className={classes.toolbar}/>
                {course && <CurrentExercise course={course} exercise={currentExercise} launchCourse={launchCourse}/>}
            </main>
        </div>
    </>);
}

export default CourseView;

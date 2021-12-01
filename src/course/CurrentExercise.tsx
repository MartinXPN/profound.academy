import {Exercise} from "../models/courses";
import {useHistory, useParams, useRouteMatch} from "react-router-dom";
import React, {useContext, useState} from "react";
import {AuthContext} from "../App";
import {useStickyState} from "../util";
import useAsyncEffect from "use-async-effect";
import LandingPage from "./LandingPage";
import {startCourse} from "../services/courses";
import {SignIn} from "../header/Auth";
import SplitPane from "react-split-pane";
import ExerciseView from "./Exercise";
import Editor from "./editor/Editor";
import RankingTable from "./RankingTable";
import makeStyles from "@mui/styles/makeStyles";
import {CourseContext} from "./Course";


const useStyles = makeStyles({
    landingPage: {
        paddingBottom: '12em',
    },
    exercise: {
        overflowY: 'auto',
        height: '100%',
    }
});

export default function CurrentExercise({exerciseIds, idToExercise, launchCourse}:
                             {exerciseIds: string[], idToExercise: {[key: string]: Exercise}, launchCourse: () => void}) {
    const classes = useStyles();
    const history = useHistory();
    let match = useRouteMatch();
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);

    // exercise management - sync localStorage with the URL
    const [currentExerciseId, setCurrentExerciseId] = useStickyState<string>('', `ex-${auth?.currentUser?.uid}-${course?.id}`);
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
        currentExerciseId in idToExercise && setExercise(idToExercise[currentExerciseId]);
    }, [idToExercise, currentExerciseId]);

    if(auth?.isSignedIn && showSignIn)
        setShowSignIn(false);

    if( !course )
        return <></>
    return <>
        {/* Display the landing page with an option to start the course if it wasn't started yet */
            ((!exercise && exerciseId !== 'ranking') || !auth?.isSignedIn) &&
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

        {/* Display the exercise of the course at the location where it was left off the last time*/}
        {auth?.isSignedIn && !showSignIn && exercise && exerciseId !== 'ranking' &&
            <SplitPane split='vertical' defaultSize={splitPos} onChange={setSplitPos}>
                <div className={classes.exercise}><ExerciseView course={course} exercise={exercise}/></div>
                <div style={{width: '100%', height: '100%'}}><Editor course={course} exercise={exercise}/></div>
            </SplitPane>
        }
        {auth?.isSignedIn && !showSignIn && exerciseId === 'ranking' &&
            <SplitPane split='vertical' defaultSize={splitPos} onChange={setSplitPos}>
                <div className={classes.exercise}><RankingTable course={course} exerciseIds={exerciseIds} /></div>
                <div style={{width: '100%', height: '100%'}} />
            </SplitPane>
        }
    </>
}

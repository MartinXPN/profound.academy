import {useParams} from "react-router-dom";
import React, {useContext, useState} from "react";
import {AuthContext} from "../App";
import {useStickyState} from "../util";
import LandingPage from "./LandingPage";
import {startCourse} from "../services/courses";
import {SignIn} from "../header/Auth";
import SplitPane from "react-split-pane";
import ExerciseView from "./Exercise";
import Editor from "./editor/Editor";
import RankingTable from "./RankingTable";
import makeStyles from "@mui/styles/makeStyles";
import {CourseContext, CurrentExerciseContext} from "./Course";
import Countdown from "react-countdown";
import {Typography} from "@mui/material";


const useStyles = makeStyles({
    landingPage: {
        paddingBottom: '12em',
    },
    exercise: {
        overflowY: 'auto',
        height: '100%',
    },
    ranking: {
        overflow: 'auto',
        height: '100%',
        width: '100%',
    }
});

export default function CurrentExercise({launchCourse}: {launchCourse: () => void}) {
    const classes = useStyles();
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);

    const {exerciseId} = useParams<{ exerciseId: string }>();
    const [showSignIn, setShowSignIn] = useState(false);
    const [splitPos, setSplitPos] = useStickyState(50, `splitPos-${auth?.currentUser?.uid}`);

    if(auth?.isSignedIn && showSignIn)
        setShowSignIn(false);


    const renderer = ({ days, hours, minutes, seconds, milliseconds, completed }:
                          {days: number, hours: number, minutes: number, seconds: number, milliseconds: number, completed: boolean}) => {
        if( !course )
            return <></>
        return completed ?
            <RankingTable metric="upsolveScore" /> :
            <div style={{textAlign: 'center'}}>
                <br/><br/><br/>
                <Typography variant="h5">Freezes in</Typography>
                <Typography variant="h2">{days * 24 + hours}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')} : {milliseconds.toString().padStart(3, '0')}</Typography>
            </div>;
    };

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
        {auth?.isSignedIn && !showSignIn && exerciseId === 'ranking' && <>
        {course.freezeAt.toDate().getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 ?
            <SplitPane split='vertical' defaultSize={splitPos} onChange={setSplitPos}>
                <div className={classes.ranking}><RankingTable metric="score"/></div>
                <Countdown
                    date={course.freezeAt.toDate()}
                    intervalDelay={0}
                    precision={3}
                    renderer={renderer}/>
            </SplitPane>
            :
            <div className={classes.ranking}><RankingTable metric="score"/></div>
        }</>}
    </>
}

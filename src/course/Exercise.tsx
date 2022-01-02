import {useParams} from "react-router-dom";
import React, {useCallback, useContext, useState} from "react";
import {AuthContext} from "../App";
import {useStickyState} from "../util";
import LandingPage from "./LandingPage";
import {startCourse} from "../services/courses";
import {SignIn} from "../user/Auth";
import Editor from "./editor/Editor";
import makeStyles from '@mui/styles/makeStyles';
import {CourseContext, CurrentExerciseContext} from "./Course";
import {Stack, Typography} from "@mui/material";
import Content from "./Content";
import Forum from "./forum/Forum";
import SubmissionsTable from "./SubmissionsTable";
import {SplitPane} from "react-multi-split-pane";
import "./SplitPane.css";
import OutlinedButton from "../common/OutlinedButton";
import Box from "@mui/material/Box";


const useStyles = makeStyles({
    exercise: {
        overflowY: 'auto',
        height: '100%',
        width: '100%',
    },
});

export default function Exercise({launchCourse}: {launchCourse: () => void}) {
    const classes = useStyles();
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);
    console.log('exercise:', exercise);

    const {exerciseId} = useParams<{ exerciseId: string }>();
    const [showSignIn, setShowSignIn] = useState(false);
    const [splitPos, setSplitPos] = useStickyState<number[] | null>(null, `splitPos-${auth?.currentUserId}`);
    const [currentTab, setCurrentTab] = useState<'description' | 'allSubmissions' | 'bestSubmissions'>('description');

    if(auth?.isSignedIn && showSignIn)
        setShowSignIn(false);

    console.log(splitPos);
    const onSplitChanged = useCallback((newSplit) => {
        console.log('split:', newSplit);
        setSplitPos(newSplit);
    }, [setSplitPos]);

    if( !course )
        return <></>
    return <>
        {/* Display the landing page with an option to start the course if it wasn't started yet */
            !exerciseId &&
            <Box paddingBottom="12em">
                <LandingPage course={course} introPageId={course.introduction} onStartCourseClicked={async () => {
                    if (auth && auth.currentUser && auth.currentUser.uid) {
                        await startCourse(auth.currentUser.uid, course.id);
                        launchCourse();
                    } else {
                        setShowSignIn(true);
                    }
                }}/>

                {showSignIn && <SignIn />}
            </Box>
        }

        {/* Display the exercise of the course at the location where it was left off the last time*/}
        {exercise &&
            <SplitPane split="vertical" defaultSizes={splitPos ?? [1, 1]} onDragFinished={onSplitChanged}>
                <div className={classes.exercise}>
                    <Stack justifyContent="center" direction="row">
                        <OutlinedButton selected={currentTab === 'description'} onClick={() => setCurrentTab('description')}>Description</OutlinedButton>
                        <OutlinedButton selected={currentTab === 'bestSubmissions'} onClick={() => setCurrentTab('bestSubmissions')}>Best Submissions</OutlinedButton>
                        <OutlinedButton selected={currentTab === 'allSubmissions'} onClick={() => setCurrentTab('allSubmissions')}>All Submissions</OutlinedButton>
                    </Stack>

                    {currentTab === 'description' && <>
                        <Content notionPage={exercise.pageId}/>
                        {auth.isSignedIn && <Forum/>}
                    </>}
                    {currentTab === 'bestSubmissions' && <SubmissionsTable course={course} exercise={exercise} mode="best" />}
                    {currentTab === 'allSubmissions' && <SubmissionsTable course={course} exercise={exercise} mode="all" />}
                </div>

                <div style={{width: '100%', height: '100%'}}>
                    {auth.isSignedIn && <Editor/>}
                    {!auth.isSignedIn && <Stack direction="column" alignItems="center">
                        <br/><br/><br/><br/><br/><br/>
                        <Typography variant="subtitle2">To check your solution you need to sign in</Typography>
                        <SignIn />
                    </Stack>}
                </div>
            </SplitPane>
        }
    </>
}

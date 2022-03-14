import {useParams} from "react-router-dom";
import React, {lazy, useCallback, useContext, useState, memo, Suspense, useEffect} from "react";
import {AuthContext} from "../../App";
import {getLocalizedParam, useStickyState} from "../../util";
import CourseLandingPage from "../CourseLandingPage";
import {SignIn} from "../../user/Auth";
import Editor from "../editor/Editor";
import {CourseContext, CurrentExerciseContext} from "../Course";
import {Grid, Stack, Typography} from "@mui/material";
import Content from "../Content";
import Forum from "../forum/Forum";
import {ExerciseSubmissionsTable} from "../SubmissionsTable";
import {SplitPane} from "react-multi-split-pane";
import "../SplitPane.css";
import OutlinedButton from "../../common/OutlinedButton";
import Box from "@mui/material/Box";
import CodeDrafts from "../CodeDrafts";
import {Edit} from "@mui/icons-material";
import {EXERCISE_TYPES} from "models/exercise";
import TextAnswer from "./TextAnswer";
import Checkboxes from "./Checkboxes";
import MultipleChoice from "./MultipleChoice";
import Dashboard from "./Dashboard";

const ExerciseEditor = lazy(() => import('./ExerciseEditor'));


function Exercise({launchCourse, registerCourse}: {launchCourse: () => void, registerCourse: () => void}) {
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);
    console.log('exercise:', exercise);

    const {exerciseId} = useParams<{ exerciseId: string }>();
    const [exerciseType, setExerciseType] = useState<keyof typeof EXERCISE_TYPES>(exercise?.exerciseType ?? 'code');
    const [splitPos, setSplitPos] = useStickyState<number[] | null>(null, `splitPos-${auth?.currentUserId}`);
    const [currentTab, setCurrentTab] = useState<'description' | 'allSubmissions' | 'bestSubmissions' | 'codeDrafts' | 'edit'>('description');
    const [codeDraftId, setCodeDraftId] = useState<string | null>(null);
    const isCourseInstructor = course && auth.currentUserId && course.instructors.includes(auth.currentUserId);

    useEffect(() => setExerciseType(exercise?.exerciseType ?? 'code'), [exercise]);
    useEffect(() => {
        if( isCourseInstructor && exercise?.order === 0 )
            setCurrentTab('edit');
    }, [exercise, isCourseInstructor]);

    console.log(splitPos);
    const onSplitChanged = useCallback((newSplit) => {
        console.log('split:', newSplit);
        setSplitPos(newSplit);
    }, [setSplitPos]);

    if( !course )
        return <></>
    let right = <></>;
    if( exerciseType === 'code' ) {
        if( !!codeDraftId && currentTab === 'codeDrafts' )  right = <Editor disableCodeSync userId={codeDraftId} />
        else                                                right = <Editor />
    }
    else if( exerciseType === 'textAnswer' )                right = <TextAnswer />
    else if( exerciseType === 'checkboxes' )                right = <Checkboxes />
    else if( exerciseType === 'multipleChoice' )            right = <MultipleChoice />
    return <>
        {/* Display the landing page with an option to start the course if it wasn't started yet */
            !exerciseId &&
            <Box paddingBottom="12em">
                <CourseLandingPage onStartCourseClicked={launchCourse} onRegisterCourseClicked={registerCourse} />
                {!auth.isSignedIn && <SignIn />}
            </Box>
        }

        {/* Display the exercise of the course at the location where it was left off the last time*/}
        {exercise &&
            <SplitPane split="vertical" defaultSizes={splitPos ?? [1, 1]} onDragFinished={onSplitChanged}>
                <Box width="100%" height="100%" sx={{overflowY: 'auto'}}>

                    <Grid container justifyContent="center">
                        <OutlinedButton selected={currentTab === 'description'} onClick={() => setCurrentTab('description')}>Description</OutlinedButton>
                        <OutlinedButton selected={currentTab === 'bestSubmissions'} onClick={() => setCurrentTab('bestSubmissions')}>Best Submissions</OutlinedButton>
                        <OutlinedButton selected={currentTab === 'allSubmissions'} onClick={() => setCurrentTab('allSubmissions')}>All Submissions</OutlinedButton>
                        {isCourseInstructor && <OutlinedButton selected={currentTab === 'codeDrafts'} onClick={() => setCurrentTab('codeDrafts')}>Code Drafts</OutlinedButton>}
                        {isCourseInstructor && <OutlinedButton selected={currentTab === 'edit'} endIcon={<Edit />} onClick={() => setCurrentTab('edit')}>Edit</OutlinedButton>}
                    </Grid>

                    {currentTab === 'description' && <>{isCourseInstructor && <Dashboard/>}<Content notionPage={getLocalizedParam(exercise.pageId)}/>{auth.isSignedIn && <Forum/>}</>}
                    {currentTab === 'bestSubmissions' && <ExerciseSubmissionsTable rowsPerPage={5} course={course} exercise={exercise} mode="best" />}
                    {currentTab === 'allSubmissions' && <ExerciseSubmissionsTable rowsPerPage={5} course={course} exercise={exercise} mode="all" />}
                    {currentTab === 'codeDrafts' && <CodeDrafts onCodeDraftSelected={setCodeDraftId} />}
                    {currentTab === 'edit' && <Suspense fallback={<></>}><ExerciseEditor cancelEditing={() => setCurrentTab('description')} exerciseTypeChanged={setExerciseType} /></Suspense>}
                </Box>

                <Box width="100%" height="100%">
                    {!auth.isSignedIn
                        ? <Grid container direction="column" alignItems="center" justifyContent="center" height="100%">
                            <Stack direction="column" alignItems="center">
                                <Typography variant="subtitle2" textAlign="center">To check your solution you need to sign in</Typography>
                                <SignIn />
                            </Stack>
                        </Grid>
                        : <>{right}</>
                    }
                </Box>
            </SplitPane>
        }
    </>
}

export default memo(Exercise);

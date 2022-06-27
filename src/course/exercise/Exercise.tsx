import {lazy, useCallback, useContext, useState, memo, Suspense, useEffect, ReactNode} from "react";
import {useParams} from "react-router-dom";
import {AuthContext} from "../../App";
import {useStickyState} from "../../common/stickystate";
import CourseLandingPage from "../CourseLandingPage";
import {SignIn} from "../../user/Auth";
import Editor from "../editor/Editor";
import {Edit} from "@mui/icons-material";
import {Grid, Typography, Box} from "@mui/material";
import Content from "../../common/notion/Content";
import Forum from "../forum/Forum";
import {SplitPane} from "react-multi-split-pane";
import "../SplitPane.css";
import OutlinedButton from "../../common/OutlinedButton";
import CodeDrafts from "../CodeDrafts";
import {EXERCISE_TYPES} from "models/exercise";
import TextAnswer from "./TextAnswer";
import Checkboxes from "./Checkboxes";
import MultipleChoice from "./MultipleChoice";
import {CourseContext, CurrentExerciseContext} from "../Course";
import Dashboard from "./Dashboard";
import {LocalizeContext} from "../../common/Localization";
import useWindowDimensions from "../../common/windowDimensions";
import ExerciseSubmissions from "../submission/ExerciseSubmissions";

const ExerciseEditor = lazy(() => import('./ExerciseEditor'));

function ConditionalSplitPane({split, children, defaultSizes, onDragFinished}: {
    split: boolean,
    defaultSizes?: number[],
    onDragFinished?: (sizes: number[]) => void,
    children: ReactNode,
}) {
    if( !split )
        return <>{children}</>
    return <>
        {/*@ts-ignore*/}
        <SplitPane split="vertical" defaultSizes={defaultSizes} onDragFinished={onDragFinished}>
            {children}
        </SplitPane>
    </>
}


function Exercise({launchCourse, registerCourse}: {launchCourse: () => void, registerCourse: () => void}) {
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);
    const {width} = useWindowDimensions();

    const {localize} = useContext(LocalizeContext);
    const {exerciseId} = useParams<{ exerciseId: string }>();
    const [exerciseType, setExerciseType] = useState<keyof typeof EXERCISE_TYPES>(exercise?.exerciseType ?? 'code');
    const [splitPos, setSplitPos] = useStickyState<number[] | null>(null, `splitPos-${auth?.currentUserId}`);
    const [currentTab, setCurrentTab] = useState<'description' | 'solve' | 'submissions' | 'codeDrafts' | 'edit'>('description');
    const [codeDraftId, setCodeDraftId] = useState<string | null>(null);
    const isCourseInstructor = course && auth.currentUserId && course.instructors.includes(auth.currentUserId);
    const split = Boolean(width > 800);

    useEffect(() => setExerciseType(exercise?.exerciseType ?? 'code'), [exercise]);
    useEffect(() => {
        if( isCourseInstructor && exercise?.levelId === 'drafts' )
            setCurrentTab('edit');
    }, [exercise, isCourseInstructor]);

    const onSplitChanged = useCallback((newSplit: number[]) => {
        console.log('split:', newSplit);
        setSplitPos(newSplit);
    }, [setSplitPos]);

    if( !course )
        return <></>
    let right = <></>;
    if( !auth.isSignedIn ) {
        right = <>
            <Grid container direction="column" alignItems="center" justifyContent="center" height="100%">
                <Typography variant="subtitle2" textAlign="center">
                    To check your solution you need to sign in
                </Typography>
                <SignIn/>
            </Grid>
        </>
    }
    else if( exerciseType === 'code' ) {
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
            <ConditionalSplitPane split={split} defaultSizes={splitPos ?? [1, 1]} onDragFinished={onSplitChanged}>
                <Box width="100%" height="100%" sx={{overflowY: 'auto'}}>
                    <Grid container justifyContent="center">
                        <OutlinedButton selected={currentTab === 'description'} onClick={() => setCurrentTab('description')}>Description</OutlinedButton>
                        {!split && <OutlinedButton selected={currentTab === 'solve'} onClick={() => setCurrentTab('solve')}>Solve</OutlinedButton>}
                        {auth.isSignedIn && <OutlinedButton selected={currentTab === 'submissions'} onClick={() => setCurrentTab('submissions')}>Submissions</OutlinedButton>}
                        {isCourseInstructor && <OutlinedButton selected={currentTab === 'codeDrafts'} onClick={() => setCurrentTab('codeDrafts')}>Code Drafts</OutlinedButton>}
                        {isCourseInstructor && <OutlinedButton selected={currentTab === 'edit'} endIcon={<Edit />} onClick={() => setCurrentTab('edit')}>Edit</OutlinedButton>}
                    </Grid>

                    {currentTab === 'description' && <>{isCourseInstructor && <Dashboard/>}<Content notionPage={localize(exercise.pageId)}/>{auth.isSignedIn && <Forum/>}</>}
                    {currentTab === 'solve' && <>{right}</>}
                    {currentTab === 'submissions' && <ExerciseSubmissions rowsPerPage={20} />}
                    {currentTab === 'codeDrafts' && <CodeDrafts onCodeDraftSelected={setCodeDraftId} />}
                    {currentTab === 'edit' && <Suspense fallback={<></>}><ExerciseEditor cancelEditing={() => setCurrentTab('description')} exerciseTypeChanged={setExerciseType} /></Suspense>}
                </Box>

                {split ? <Box width="100%" height="100%">{right}</Box> : <></>}
            </ConditionalSplitPane>
        }
    </>
}

export default memo(Exercise);

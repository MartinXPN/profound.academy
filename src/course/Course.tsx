import {createContext, memo, lazy, useCallback, useContext, useEffect, useState, Suspense} from "react";
import {Route, Routes, useNavigate, useParams} from "react-router-dom";

import {styled, useTheme} from '@mui/material/styles';

import {onCourseChanged, registerForCourse} from "../services/courses";
import {createCourseExercise, getExercise, getFirstExercise} from "../services/exercises";
import useAsyncEffect from "use-async-effect";
import {Course} from "models/courses";
import {Exercise as ExerciseModel} from "models/exercise";
import {AuthContext} from "../App";
import CourseDrawer from "./drawer/Drawer";
import Exercise from "./exercise/Exercise";
import {safeParse} from "../common/stickystate";
import StatusPage from "./StatusPage";
import LandingPage from "../home/LandingPage";
import {Helmet} from "react-helmet-async";
import {LocalizeContext} from "../common/Localization";
import {Box} from "@mui/material";
import {useScreenAnalytics} from "../analytics";

const CourseEditor = lazy(() => import('./CourseEditor'));


const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: theme.spacing(0, 2),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

export const CourseContext = createContext<{ course: Course | null }>({course: null});
export const CurrentExerciseContext = createContext<{ exercise: ExerciseModel | null }>({exercise: null});


export const lastExerciseId = (userId?: string, courseId?: string) => {
    const key = `ex-${userId}-${courseId}`;
    if( !(key in localStorage) )
        return null;

    const storageValue = localStorage.getItem(key);
    return safeParse(storageValue, '');
};

function CurrentCourseView({openPage}: {openPage: (page: string) => void}) {
    const auth = useContext(AuthContext);
    const theme = useTheme();
    const {localize} = useContext(LocalizeContext);
    const {course} = useContext(CourseContext);
    const {exerciseId} = useParams<{ exerciseId: string }>();
    const [currentExercise, setCurrentExercise] = useState<ExerciseModel | null>(null);
    const [drawerWidth, setDrawerWidth] = useState<string>(theme.spacing(9));
    useScreenAnalytics(`exercise-${exerciseId}`);

    useEffect(() => {
        const key = `ex-${auth?.currentUserId}-${course?.id}`;
        localStorage.setItem(key, JSON.stringify(exerciseId));
    }, [exerciseId, auth?.currentUserId, course?.id]);

    const openExercise = useCallback((exercise: ExerciseModel) => {
        console.log('openExercise:', exercise.id);
        if( exerciseId !== exercise.id )
            openPage(exercise.id);
        setCurrentExercise(exercise);
    }, [openPage, exerciseId]);
    const openStatus = useCallback(() => openPage('status'), [openPage]);

    const launchCourse = useCallback(async () => {
        if( !course )   return;
        console.log('Launching the course');
        const firstExercise = await getFirstExercise(course.id);
        openExercise(firstExercise);
    }, [course, openExercise]);

    const registerCourse = useCallback(async () => {
        if( !course || !auth.currentUserId )   return;
        console.log('Registering for the course!');
        await registerForCourse(auth.currentUserId, course.id);
    }, [auth.currentUserId, course]);

    const createExercise = useCallback(async () => {
        if( !course )   return;
        const ex = await createCourseExercise(course.id);
        if( ex )    openPage(ex.id);
        else        setCurrentExercise(null);
    }, [course, openPage]);

    useAsyncEffect(async () => {
        if( !course || !exerciseId )
            return;
        if( currentExercise && currentExercise.id === exerciseId )
            return console.log('Not loading the exercise as it is already the current one', currentExercise.id, exerciseId, currentExercise);

        const ex = await getExercise(course.id, exerciseId);
        if( ex )    openExercise(ex);
        else        setCurrentExercise(null);
    }, [exerciseId, currentExercise, course, openExercise, setCurrentExercise]);

    let content;
    if (exerciseId === 'status' )       content = <StatusPage />
    else if (exerciseId === 'edit' )    content = <Suspense fallback={<></>}><CourseEditor course={course} /></Suspense>
    else                                content = <Exercise launchCourse={launchCourse} registerCourse={registerCourse} />
    return <>
        <Helmet>
            <title>{currentExercise?.title ? `${localize(currentExercise?.title)} • ` : ''}{course?.title}</title>
        </Helmet>
        <CurrentExerciseContext.Provider value={{exercise: currentExercise}}>
            <CourseDrawer
                onItemSelected={openExercise}
                onStatusClicked={openStatus}
                onCreateExerciseClicked={createExercise}
                onWidthChanged={setDrawerWidth}/>

            <Box flexGrow={1} padding={0} maxWidth={`calc(100vw - ${drawerWidth} - 1px)`}>
                <DrawerHeader />
                {content}
            </Box>
        </CurrentExerciseContext.Provider>
    </>
}


const Root = styled('div')({
    display: 'flex',
    height: 'calc(100vh - 64px)',
});


function CourseView() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const {courseId} = useParams<{ courseId: string }>();
    const [course, setCourse] = useState<Course | null>(null);
    const [error, setError] = useState<string | null>(null);
    useScreenAnalytics(`course-${courseId}`);

    useEffect(() => {
        if( !courseId )
            return;
        return onCourseChanged(courseId, (course) => {
            setCourse(course);
            setError(course ? null : 'You are not allowed to view the course. Please sign in or return to homepage');
        });
    }, [courseId, auth]);

    const openPage = useCallback((pageId: string) => navigate(pageId), [navigate]);

    if( error )     return <LandingPage error={error} />
    if( !course )   return <></>
    return <>
        <Helmet>
            <title>{course.title}</title>
            <meta property="og:title" content={course.title} />
            <meta property="og:image" content={course.img} />
            <meta property="og:image:alt" content={course.title} />
            <meta property="og:type" content="article" />
            <meta name="description" content={`Comprehensive course for ${course.title} with hands-on experience in mind`} />
        </Helmet>

        <CourseContext.Provider value={{course: course}}>
        <Routes>
            <Route path=":exerciseId" element={<Root><CurrentCourseView openPage={openPage} /></Root>} />
            <Route path="" element={<Root><CurrentCourseView openPage={openPage} /></Root>} />
        </Routes>
        </CourseContext.Provider>
    </>
}

export default memo(CourseView);

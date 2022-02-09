import React, {createContext, memo, lazy, useCallback, useContext, useEffect, useState, Suspense} from "react";
import {Route, Routes, useNavigate, useParams} from "react-router-dom";

import {styled} from '@mui/material/styles';

import {createCourseExercise, getCourse, getExercise, getFirstExercise} from "../services/courses";
import useAsyncEffect from "use-async-effect";
import {Course, Exercise as ExerciseModel} from "../models/courses";
import {AuthContext} from "../App";
import CourseDrawer from "./drawer/Drawer";
import Exercise from "./exercise/Exercise";
import {getLocalizedParam, safeParse} from "../util";
import StatusPage from "./StatusPage";

const CourseEditor = lazy(() => import('./CourseEditor'));


const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: theme.spacing(0, 2),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

const Content = styled('main')({
    flexGrow: 1,
    padding: 0,
});

export const CourseContext = createContext<{ course: Course | null }>({course: null});
export const CurrentExerciseContext = createContext<{ exercise: ExerciseModel | null }>({exercise: null});


export const lastExerciseId = (userId?: string, courseId?: string) => {
    const key = `ex-${userId}-${courseId}`;
    const storageValue = localStorage.getItem(key);
    return safeParse(storageValue, '');
};

function CurrentCourseView({openPage}: {openPage: (page: string) => void}) {
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const {exerciseId} = useParams<{ exerciseId: string }>();
    const [currentExercise, setCurrentExercise] = useState<ExerciseModel | null>(null);

    useEffect(() => {
        const key = `ex-${auth?.currentUserId}-${course?.id}`;
        localStorage.setItem(key, JSON.stringify(exerciseId));
    }, [exerciseId, auth?.currentUserId, course?.id]);

    const openExercise = useCallback((exercise: ExerciseModel) => {
        exercise.title = getLocalizedParam(exercise.title);
        exercise.pageId = getLocalizedParam(exercise.pageId);
        openPage(exercise.id);
        setCurrentExercise(exercise);
    }, [openPage]);
    const openStatus = useCallback(() => openPage('status'), [openPage]);
    const launchCourse = useCallback(async () => {
        if( !course )   return;

        console.log('Launching the course!');
        const firstExercise = await getFirstExercise(course.id);
        openExercise(firstExercise);
    }, [course, openExercise]);
    const createExercise = useCallback(async () => {
        if( !course )   return;
        const ex = await createCourseExercise(course.id);
        if( ex )    openPage(ex.id);
        else        setCurrentExercise(null);
    }, [course, openPage]);

    useAsyncEffect(async () => {
        if( !course || !exerciseId )
            return;
        if( currentExercise && currentExercise.id === exerciseId ) {
            console.log('Not loading the exercise as it is already the current one', currentExercise.id, exerciseId, currentExercise);
            return;
        }

        const ex = await getExercise(course.id, exerciseId);
        if( ex )    openExercise(ex);
        else        setCurrentExercise(null);
    }, [exerciseId, currentExercise, course, openExercise, setCurrentExercise]);

    let content;
    if (exerciseId === 'status' )       content = <StatusPage />
    else if (exerciseId === 'edit' )    content = <Suspense fallback={<></>}><CourseEditor course={course} /></Suspense>
    else                                content = <Exercise launchCourse={launchCourse} />
    return <>
        <CurrentExerciseContext.Provider value={{exercise: currentExercise}}>
            <CourseDrawer
                onItemSelected={openExercise}
                onStatusClicked={openStatus}
                onCreateExerciseClicked={createExercise}/>

            <Content>
                <DrawerHeader />
                {content}
            </Content>
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

    useAsyncEffect(async () => {
        if( !courseId )
            return;
        const course = await getCourse(courseId);
        setCourse(course);
    }, [courseId, auth]);

    const openPage = useCallback((pageId: string) => navigate(pageId), [navigate]);

    if( !course )
        return <></>
    return (
        <CourseContext.Provider value={{course: course}}>
        <Routes>
            <Route path=":exerciseId" element={<Root><CurrentCourseView openPage={openPage} /></Root>} />
            <Route path="" element={<Root><CurrentCourseView openPage={openPage} /></Root>} />
        </Routes>
        </CourseContext.Provider>
    );
}

export default memo(CourseView);

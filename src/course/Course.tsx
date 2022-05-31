import React, {createContext, memo, lazy, useCallback, useContext, useEffect, useState, Suspense} from "react";
import {styled} from '@mui/material/styles';
import useAsyncEffect from "use-async-effect";
import {useRouter} from "next/router";

import {registerForCourse} from "../services/courses";
import {createCourseExercise, getExercise, getFirstExercise} from "../services/exercises";
import {Course} from "models/courses";
import {Exercise as ExerciseModel} from "models/exercise";
import CourseDrawer from "./drawer/Drawer";
import Exercise from "./exercise/Exercise";
import {safeParse} from "../common/stickystate";
import StatusPage from "./StatusPage";
import AuthContext from "../user/AuthContext";

const CourseEditor = lazy(() => import('./CourseEditor'));


const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: theme.spacing(0, 2),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

const Content = styled('main')(({ theme }) => ({
    // maxWidth = screenWidth - drawerWidth
    maxWidth: `calc(100vw - ${theme.spacing(9)} - 1px)`,
    flexGrow: 1,
    padding: 0,
}));

export const CourseContext = createContext<{ course: Course | null }>({course: null});
export const CurrentExerciseContext = createContext<{ exercise: ExerciseModel | null }>({exercise: null});


export const lastExerciseId = (userId?: string, courseId?: string) => {
    const key = `ex-${userId}-${courseId}`;
    const storageValue = localStorage.getItem(key);
    return safeParse(storageValue, '');
};

function CurrentCourseView({openPage}: {openPage: (page: string) => void}) {
    const router = useRouter();
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const { exerciseId } = router.query;
    const [currentExercise, setCurrentExercise] = useState<ExerciseModel | null>(null);

    useEffect(() => {
        const key = `ex-${auth?.currentUserId}-${course?.id}`;
        localStorage.setItem(key, JSON.stringify(exerciseId));
    }, [exerciseId, auth?.currentUserId, course?.id]);

    const openExercise = useCallback((exercise: ExerciseModel) => {
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
        if( currentExercise && currentExercise.id === exerciseId ) {
            console.log('Not loading the exercise as it is already the current one', currentExercise.id, exerciseId, currentExercise);
            return;
        }

        const ex = await getExercise(course.id, exerciseId as string);
        if( ex )    openExercise(ex);
        else        setCurrentExercise(null);
    }, [exerciseId, currentExercise, course, openExercise, setCurrentExercise]);

    let content;
    if (exerciseId === 'status' )       content = <StatusPage />
    else if (exerciseId === 'edit' )    content = <Suspense fallback={<></>}><CourseEditor course={course} /></Suspense>
    else                                content = <Exercise launchCourse={launchCourse} registerCourse={registerCourse} />
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

export default memo(CurrentCourseView);

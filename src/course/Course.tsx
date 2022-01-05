import React, {createContext, useCallback, useContext, useEffect, useState} from "react";
import {Route, Switch, useHistory, useParams, useRouteMatch} from "react-router-dom";

import {styled} from '@mui/material/styles';

import {getCourse, getExercise, getFirstExercise} from "../services/courses";
import useAsyncEffect from "use-async-effect";
import {Course, Exercise as ExerciseModel} from "../models/courses";
import {AuthContext} from "../App";
import CourseDrawer from "./drawer/Drawer";
import Exercise from "./Exercise";
import {safeParse} from "../util";
import StatusPage from "./StatusPage";
import CourseEditor from "./CourseEditor";


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
        setCurrentExercise(exercise);
        openPage(exercise.id);
    }, [openPage]);
    const openStatus = useCallback(() => openPage('status'), [openPage]);
    const launchCourse = useCallback(async () => {
        console.log('Launching the course!');
        if( course ) {
            const firstExercise = await getFirstExercise(course.id);
            if( firstExercise )
                openPage(firstExercise.id);
        }
    }, [course, openPage]);

    useAsyncEffect(async () => {
        if( !course || !exerciseId )
            return;
        if( currentExercise && currentExercise.id === exerciseId ) {
            console.log('Not loading the exercise as it is already the current one', currentExercise.id, exerciseId, currentExercise);
            return;
        }

        const ex = await getExercise(course.id, exerciseId);
        console.log('Updating current exercise to:', ex);
        setCurrentExercise(ex);
    }, [exerciseId, currentExercise, course]);

    let content;
    if (exerciseId === 'status' )       content = <StatusPage />
    else if (exerciseId === 'edit' )    content = <CourseEditor course={course} />
    else                                content = <Exercise launchCourse={launchCourse} />
    return <>
        <CurrentExerciseContext.Provider value={{exercise: currentExercise}}>
            <CourseDrawer
                onItemSelected={openExercise}
                onStatusClicked={openStatus} />

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
    const history = useHistory();
    const match = useRouteMatch();
    const {courseId} = useParams<{ courseId: string }>();
    const [course, setCourse] = useState<Course | null>(null);

    useAsyncEffect(async () => {
        const course = await getCourse(courseId);
        setCourse(course);
    }, [courseId, auth]);

    const openPage = useCallback((pageId: string) => {
        const url = match.url.replace(/\/$/, '');
        history.push(`${url}/${pageId}`);
    }, [history, match.url]);

    if( !course )
        return <></>
    return (
        <CourseContext.Provider value={{course: course}}>
        <Switch>
            <Route path={`${match.path}/:exerciseId?`}>

            <Root>
                <CurrentCourseView openPage={openPage} />
            </Root>
            </Route>
        </Switch>
        </CourseContext.Provider>
    );
}

export default CourseView;

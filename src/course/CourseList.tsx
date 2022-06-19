import {memo, useContext} from 'react';
import {ImageListItemBar, Grid, Stack, Box, Typography, ListItemButton} from '@mui/material';
import {Add} from "@mui/icons-material";

import {Course} from 'models/courses';
import {getAllCourses, getCompletedCourses, getUserCourses} from "../services/courses";
import useAsyncEffect from "use-async-effect";
import {Link} from "react-router-dom";
import {useStickyState} from "../common/stickystate";
import {lastExerciseId} from "./Course";
import {AuthContext} from "../App";
import {hasInstructorRole} from "../services/users";


function CourseList({variant, title, userId}: {
    variant: 'allCourses' | 'userCourses' | 'completedCourses',
    title: string,
    userId?: string
}) {
    const auth = useContext(AuthContext);
    const [courses, setCourses] = useStickyState<Course[] | null>(null, `${variant}-${userId}`);
    const [hasInstructorPermissions, setHasInstructorPermissions] = useStickyState(false, `isInstructor-${userId}`);
    const isCurrentUserCourses = userId && auth.currentUserId === userId && variant === 'userCourses';

    useAsyncEffect(async () => {
        if( variant === 'allCourses' ) {
            const res = await getAllCourses();
            setCourses(res);
            return;
        }
        if (!userId)
            return;
        console.log('user id:', userId);

        const res = variant === 'userCourses' ? await getUserCourses(userId) : await getCompletedCourses(userId);
        setCourses(res);
    }, [variant, userId]);

    useAsyncEffect(async () => {
        if( !isCurrentUserCourses || !auth.currentUserId )
            return;

        const isInstructor = await hasInstructorRole(auth.currentUserId);
        setHasInstructorPermissions(isInstructor);
    }, [isCurrentUserCourses, auth.currentUserId, setHasInstructorPermissions]);

    const lastCoursePage = (courseId: string) => {
        const lastEx = lastExerciseId(auth?.currentUserId, courseId);
        return lastEx ? `/${courseId}/${lastEx}` : `/${courseId}`;
    }

    if( !courses || (courses.length === 0 && !hasInstructorPermissions) )
        return <></>
    return <>
        <Typography variant="h1" textAlign="center" marginTop={2} fontSize={32}>{title}</Typography>
        <Box display="flex" justifyContent="center" alignItems="center">
            <Grid container alignItems="center" justifyContent="center" width={1000} maxWidth="100%" spacing={0.5}>
                {isCurrentUserCourses && hasInstructorPermissions &&
                <Grid item height={180} width={300} maxWidth="50%" key="create-course">
                <ListItemButton component={Link} to="/new" sx={{border: 1, borderColor: '#e1e1e1', width: '100%', height: '100%', padding: 0}}>
                    <Stack direction="column" alignItems="center" justifyContent="center" height="100%" width="100%" flexGrow={1}>
                        <Add fontSize="large" color="action" />
                        <Typography>Create a new course</Typography>
                    </Stack>
                </ListItemButton>
                </Grid>}

                {courses.map((item: Course) => (
                    <Grid item height={180} width={300} maxWidth="50%" key={item.id}>
                    <ListItemButton component={Link} to={lastCoursePage(item.id)} sx={{width: '100%', height: '100%', padding: 0}}>
                        <img src={item.img} alt={item.title} loading="lazy" style={{height: '100%', width: '100%', objectFit: 'cover'}} />
                        <ImageListItemBar title={item.title} subtitle={<span>by: {item.author}</span>} />
                    </ListItemButton>
                    </Grid>
                ))}
            </Grid>
        </Box>
    </>;
}

export default memo(CourseList);

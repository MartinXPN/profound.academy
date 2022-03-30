import React, {memo, useCallback, useContext} from 'react';
import {styled} from '@mui/material/styles';
import {ImageListItem, ImageListItemBar, Grid, Stack, Box, Typography} from '@mui/material';
import {Add} from "@mui/icons-material";

import {Course} from 'models/courses';
import {getAllCourses, getCompletedCourses, getUserCourses} from "../services/courses";
import useAsyncEffect from "use-async-effect";
import {useNavigate} from "react-router-dom";
import {useStickyState} from "../common/stickystate";
import {lastExerciseId} from "./Course";
import {AuthContext} from "../App";
import {hasInstructorRole} from "../services/users";

const ClickableImageListItem = styled(ImageListItem)({
    "&:focus,&:hover": {
        cursor: 'pointer',
    }
});


function CourseList({variant, title, userId}: {
    variant: 'allCourses' | 'userCourses' | 'completedCourses',
    title: string,
    userId?: string
}) {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
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

    const onCreateCourseClicked = useCallback(() => navigate('/new'), [navigate]);
    const onCourseSelected = useCallback((courseId: string) => {
        const lastEx = lastExerciseId(auth?.currentUserId, courseId);
        if( lastEx )    navigate(`/${courseId}/${lastEx}`);
        else            navigate(`/${courseId}`);
    }, [auth?.currentUserId, navigate]);


    if( !courses || (courses.length === 0 && !hasInstructorPermissions) )
        return <></>
    return <>
        <Typography variant="h5" textAlign="center" marginTop={2}>{title}</Typography>
        <Box display="flex" flexWrap="wrap" justifyContent="space-around" overflow="hidden">
            <Grid container alignItems="center" justifyContent="center" width={1000} maxWidth="100%" spacing={0.5}>
                {isCurrentUserCourses && hasInstructorPermissions &&
                <Grid item height={180} width={300} display="flex" flexDirection="row">
                <ClickableImageListItem key="create-course" onClick={onCreateCourseClicked} sx={{border: 1, borderColor: '#e1e1e1', flexDirection: 'column', flexGrow: 1}}>
                    <Stack direction="column" alignItems="center" justifyContent="center" height="100%" width="100%" flexGrow={1}>
                        <Add fontSize="large" color="action" />
                        <Typography>Create a new course</Typography>
                    </Stack>
                </ClickableImageListItem>
                </Grid>}

                {courses.map((item: Course) => (
                    <Grid item height={180} width={300} display="flex" flexDirection="row">
                    <ClickableImageListItem key={item.id} onClick={() => onCourseSelected(item.id)} sx={{flexDirection: 'column', flexGrow: 1}}>
                        <img src={item.img} alt={item.title} loading="lazy" style={{flexGrow: 1, objectFit: 'cover'}} />
                        <ImageListItemBar title={item.title} subtitle={<span>by: {item.author}</span>} />
                    </ClickableImageListItem>
                    </Grid>
                ))}
            </Grid>
        </Box>
    </>;
}

export default memo(CourseList);

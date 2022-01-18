import React, {memo, useCallback, useContext} from 'react';
import {styled} from '@mui/material/styles';
import {ImageList, ImageListItem, ImageListItemBar, IconButton, Grid} from '@mui/material';
import {Tooltip, Typography} from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import {Add} from "@mui/icons-material";
import Box from "@mui/material/Box";

import {Course} from '../models/courses';
import {getAllCourses, getCompletedCourses, getUserCourses} from "../services/courses";
import useAsyncEffect from "use-async-effect";
import {useHistory} from "react-router-dom";
import {useStickyState} from "../util";
import {lastExerciseId} from "./Course";
import {AuthContext} from "../App";
import {hasInstructorRole} from "../services/users";

const ClickableImageListItem = styled(ImageListItem)({
    "&:focus,&:hover": {
        cursor: 'pointer',
    }
});


function CourseList({variant, title, userId}: {
    variant: 'allCourses' | 'userCourses' | 'completedCourses', title: string, userId?: string
}) {
    const auth = useContext(AuthContext);
    const history = useHistory();
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

    const onCreateCourseClicked = useCallback(() => history.push('/new'), [history]);
    const onCourseSelected = useCallback((courseId: string) => {
        const lastEx = lastExerciseId(auth?.currentUserId, courseId);
        if( lastEx )    history.push(`/${courseId}/${lastEx}`);
        else            history.push(`/${courseId}`);
    }, [auth?.currentUserId, history]);


    if( !courses || courses.length === 0 )
        return <></>
    return <>
        <Typography variant="h5" textAlign="center" marginTop={2}>{title}</Typography>
        <Box display="flex" flexWrap="wrap" justifyContent="space-around" overflow="hidden">
            <ImageList rowHeight={180} sx={{width: 600, minHeight: 300}}>
                {isCurrentUserCourses && hasInstructorPermissions &&
                <ClickableImageListItem key="create-course" onClick={onCreateCourseClicked} sx={{border: 1, borderColor: '#e1e1e1'}}>
                    <Grid container direction="column" alignItems="center" justifyContent="center" height="100%">
                        <Add fontSize="large" color="action" />
                        <Typography>Create a new course</Typography>
                    </Grid>
                </ClickableImageListItem>}

                {courses.map((item: Course) => (
                    <ClickableImageListItem key={item.id} onClick={() => onCourseSelected(item.id)}>
                        <img src={item.img} alt={item.title} loading="lazy" 
                             style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                        <ImageListItemBar
                            title={item.title}
                            subtitle={<span>by: {item.author}</span>}
                            actionIcon={
                                <IconButton size="large" sx={{color: 'rgba(255, 255, 255, 0.70)'}}>
                                    <Tooltip title={item.details} placement="top-start">
                                        <InfoIcon fontSize='small'/>
                                    </Tooltip>
                                </IconButton>
                            }
                        />
                    </ClickableImageListItem>
                ))}
            </ImageList>
        </Box>
    </>;
}

export default memo(CourseList);

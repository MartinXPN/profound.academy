import React, {memo, useCallback, useContext} from 'react';
import {styled} from '@mui/material/styles';
import {ImageList, ImageListItem, ImageListItemBar, IconButton} from '@mui/material';
import {Tooltip, Typography} from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';

import {Course} from '../models/courses';
import {getAllCourses, getCompletedCourses, getUserCourses} from "../services/courses";
import useAsyncEffect from "use-async-effect";
import {useHistory} from "react-router-dom";
import {useStickyState} from "../util";
import {lastExerciseId} from "./Course";
import {AuthContext} from "../App";
import Box from "@mui/material/Box";

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

    const onCourseSelected = useCallback((courseId: string) => {
        const lastEx = lastExerciseId(auth?.currentUserId, courseId);
        if( lastEx )    history.push(`/${courseId}/${lastEx}`);
        else            history.push(`/${courseId}`);
    }, [auth?.currentUserId, history]);


    if( !courses || courses.length === 0 )
        return <></>
    return <>
        <Typography variant='h5' sx={{display: 'flex', justifyContent: 'center', marginTop: 2}}>{title}</Typography>
        <Box display="flex" flexWrap="wrap" justifyContent="space-around" overflow="hidden">
            <ImageList rowHeight={180} sx={{width: 600, minHeight: 300}}>
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

import React, {memo} from 'react';
import {Theme} from '@mui/material/styles';
import {createStyles, makeStyles} from '@mui/styles';
import {ImageList, ImageListItem, ImageListItemBar, IconButton} from '@mui/material';
import {Tooltip, Typography} from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';

import {Course} from '../models/courses';
import {getAllCourses, getCompletedCourses, getUserCourses} from "../services/courses";
import useAsyncEffect from "use-async-effect";
import {useHistory} from "react-router-dom";
import {useStickyState} from "../util";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-around',
            overflow: 'hidden',
            backgroundColor: theme.palette.background.paper,
        },
        imageList: {
            width: 600,
            minHeight: 300,
        },
        listItem: {
            "&:focus,&:hover": {
                cursor: 'pointer',
            }
        },
        icon: {
            color: 'rgba(255, 255, 255, 0.54)',
        },
        title: {
            display: 'flex',
            justifyContent: 'center',
            marginTop: theme.spacing(2),
        },
    }),
);

function CourseList({variant, title, userId}: {
    variant: 'allCourses' | 'userCourses' | 'completedCourses', title: string, userId?: string
}) {
    const history = useHistory();
    const classes = useStyles();
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


    if( !courses || courses.length === 0 )
        return <></>
    return <>
        <Typography variant='h5' className={classes.title}>{title}</Typography>
        <div className={classes.root}>
            <ImageList rowHeight={180} className={classes.imageList}>
                {courses.map((item: Course) => (
                    <ImageListItem className={classes.listItem} key={item.id}
                                   onClick={() => history.push(`/${item.id}`)}>
                        <img src={item.img} alt={item.title} loading="lazy" 
                             style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                        <ImageListItemBar
                            title={item.title}
                            subtitle={<span>by: {item.author}</span>}
                            actionIcon={
                                <IconButton
                                    aria-label={`info about ${item.title}`}
                                    className={classes.icon}
                                    size="large">
                                    <Tooltip title={item.details} placement="top-start">
                                        <div><InfoIcon fontSize='small'/></div>
                                    </Tooltip>
                                </IconButton>
                            }
                        />
                    </ImageListItem>
                ))}
            </ImageList>
        </div>
    </>;
}

export default memo(CourseList);

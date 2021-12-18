import React, {memo, useContext} from 'react';
import {Theme} from '@mui/material/styles';
import {createStyles, makeStyles} from '@mui/styles';
import {ImageList, ImageListItem, ImageListItemBar, IconButton} from '@mui/material';
import {Tooltip, Typography} from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';

import {Course} from '../models/courses';
import {getAllCourses, getUserCourses} from "../services/courses";
import useAsyncEffect from "use-async-effect";
import {AuthContext} from "../App";
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
            minHeight: 400,
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

const ListView = ({courses}: {courses: Course[]}) => {
    const history = useHistory();
    const classes = useStyles();

    return <>
        <div className={classes.root}>
            <ImageList rowHeight={180} className={classes.imageList}>
                {courses.map((item) => (
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
const CourseListView = memo(ListView);


function CourseList() {
    const auth = useContext(AuthContext);
    const classes = useStyles();
    const [allCourses, setAllCourses] = useStickyState<Course[] | null>(null, `allCourses`);
    const [userCourses, setUserCourses] = useStickyState<Course[] | null>(null, `userCourses-${auth?.currentUser?.uid}`);

    useAsyncEffect(async () => {
        const res = await getAllCourses();
        setAllCourses(res);
    }, []);

    useAsyncEffect(async () => {
        if (!auth.currentUserId)
            return;

        console.log('user id:', auth.currentUserId);
        const res = await getUserCourses(auth.currentUserId);
        setUserCourses(res);
    }, [auth.currentUserId]);


    return <>
        {(auth?.isSignedIn && userCourses && userCourses.length > 0) &&
        <>
            <Typography variant='h5' className={classes.title}>My Curriculum</Typography>
            <CourseListView courses={userCourses}/>
        </>}

        <Typography variant='h5' className={classes.title}>All Courses</Typography>
        <CourseListView courses={allCourses ?? []}/>
    </>
}

export default memo(CourseList);

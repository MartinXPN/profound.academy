import React, {useContext, useState} from 'react';
import {Theme, createStyles, makeStyles} from '@material-ui/core/styles';
import ImageList from '@material-ui/core/ImageList';
import ImageListItem from '@material-ui/core/ImageListItem';
import ImageListItemBar from '@material-ui/core/ImageListItemBar';
import IconButton from '@material-ui/core/IconButton';
import InfoIcon from '@material-ui/icons/Info';

import {Tooltip, Typography} from "@material-ui/core";

import {Course} from '../models/courses';
import {getAllCourses, getUserCourses} from "../services/courses";
import useAsyncEffect from "use-async-effect";
import {AuthContext} from "../App";
import {useHistory} from "react-router-dom";

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
            height: 400,
        },
        icon: {
            color: 'rgba(255, 255, 255, 0.54)',
        },
        title: {
            display: 'flex',
            justifyContent: 'center',
            marginTop: theme.spacing(4),
            marginBottom: theme.spacing(1),
        },
    }),
);


interface CourseListProps {
    courses: Course[];
}

function CourseListView(props: CourseListProps) {
    const history = useHistory();
    const classes = useStyles();
    const {courses} = props;

    return (
        <>
            <div className={classes.root}>
                <ImageList rowHeight={180} className={classes.imageList}>
                    {courses.map((item) => (
                        <ImageListItem key={item.id} onClick={() => history.push(`/courses/${item.id}`)}>
                            <img src={item.img} alt={item.title}/>
                            <ImageListItemBar
                                title={item.title}
                                subtitle={<span>by: {item.author}</span>}
                                actionIcon={
                                    <IconButton aria-label={`info about ${item.title}`} className={classes.icon}>
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
        </>
    )
}

function CourseList() {
    const classes = useStyles();
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [userCourses, setUserCourses] = useState<Course[]>([]);
    const auth = useContext(AuthContext);

    useAsyncEffect(async () => {
        const res = await getAllCourses();
        setAllCourses(res);
    }, []);

    useAsyncEffect(async () => {
        const user = auth?.currentUser;
        if(!auth?.isSignedIn || !user || !user.uid)
            return;

        if(!user || !user.uid)  return;
        console.log('user id:', user.uid);
        const res = await getUserCourses(user.uid);
        setUserCourses(res);
    }, [auth]);


    return (
        <>
            {(auth?.isSignedIn && userCourses.length > 0) &&
            <>
                <Typography variant='h5' className={classes.title}>My Curriculum</Typography>
                <CourseListView courses={userCourses}/>
            </>}

            <Typography variant='h5' className={classes.title}>All Courses</Typography>
            <CourseListView courses={allCourses}/>
        </>
    )
}

export default CourseList;

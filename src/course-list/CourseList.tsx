import React, {useEffect, useState} from 'react';
import {Theme, createStyles, makeStyles} from '@material-ui/core/styles';
import ImageList from '@material-ui/core/ImageList';
import ImageListItem from '@material-ui/core/ImageListItem';
import ImageListItemBar from '@material-ui/core/ImageListItemBar';
import IconButton from '@material-ui/core/IconButton';
import InfoIcon from '@material-ui/icons/Info';

import firebase from "firebase/app";

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
            width: 500,
            height: 450,
        },
        icon: {
            color: 'rgba(255, 255, 255, 0.54)',
        },
        title: {
            display: 'flex',
            justifyContent: 'center',
        },
    }),
);


interface Course {
    img: string;
    title: string;
    author: string;
}

function CourseList() {
    const classes = useStyles();
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [courses, setCourses] = useState<Course[]>([]);

    // Listen to the Firebase Auth state and set the local state.
    useEffect(() => {
        const unregisterAuthObserver = firebase.auth().onAuthStateChanged(user => setIsSignedIn(!!user));
        return () => unregisterAuthObserver(); // Make sure we un-register Firebase observers when the component unmounts.
    }, []);

    useEffect(() => {
        // TODO: Fetch the list from firestore
        setCourses([
            {
                img: 'https://firebasestorage.googleapis.com/v0/b/profound-academy.appspot.com/o/images%2Fcompetitive-programming-logo.jpg?alt=media&token=d836f31a-ccb8-41c7-901f-13b645525a9a',
                title: 'Competitive Programming',
                author: 'Martin & Edward',
            },
            {
                img: 'https://firebasestorage.googleapis.com/v0/b/profound-academy.appspot.com/o/images%2Fml-logo.png?alt=media&token=d402197b-552a-4eab-889f-5d6bdc9c8336',
                title: 'Introduction to Machine Learning',
                author: 'Martin & Hrant',
            }
        ])
    }, [])

    return (
        <>
            {isSignedIn && <div>My Curriculum</div>}
            <h1 className={classes.title}>All Courses</h1>
            <div className={classes.root}>
                <ImageList rowHeight={180} className={classes.imageList}>
                    {courses.map((item) => (
                        <ImageListItem key={item.img}>
                            <img src={item.img} alt={item.title}/>
                            <ImageListItemBar
                                title={item.title}
                                subtitle={<span>by: {item.author}</span>}
                                actionIcon={
                                    <IconButton aria-label={`info about ${item.title}`} className={classes.icon}>
                                        <InfoIcon/>
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

export default CourseList;

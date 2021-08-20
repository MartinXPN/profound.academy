import React, {useContext, useState} from "react";
import {useParams} from "react-router-dom";
import {getCourse, startCourse} from "../services/courses";
import useAsyncEffect from "use-async-effect";
import {Course} from "../models/courses";
import LandingPage from "./LandingPage";
import {AuthContext} from "../App";
import SplitPane from 'react-split-pane';
import {Tutorial} from "../models/tutorials";
import {getCourseTutorials} from "../services/tutorials";
import Auth from "../header/Auth";
import Editor from "./Editor";
import TutorialView from "./Tutorial";


import clsx from 'clsx';
import {createStyles, makeStyles, useTheme, Theme} from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import zIndex from "@material-ui/core/styles/zIndex";

const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            display: 'flex',
        },
        appBar: {
            zIndex: theme.zIndex.drawer + 1,
            transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
        },
        appBarShift: {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
        },
        menuButton: {
            marginRight: 36,
        },
        hide: {
            display: 'none',
        },
        drawer: {
            width: drawerWidth,
            flexShrink: 0,
            whiteSpace: 'nowrap',
        },
        drawerOpen: {
            width: drawerWidth,
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
        },
        drawerClose: {
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
            overflowX: 'hidden',
            width: theme.spacing(7) + 1,
            [theme.breakpoints.up('sm')]: {
                width: theme.spacing(9) + 1,
            },
        },
        toolbar: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: theme.spacing(0, 1),
            // necessary for content to be below app bar
            ...theme.mixins.toolbar,
        },
        content: {
            flexGrow: 1,
            padding: theme.spacing(0),
        },
    }),
);

interface CourseDrawerProps {
    tutorials: Tutorial[];
}

function CourseWithDrawer(props: CourseDrawerProps) {
    const classes = useStyles();
    const theme = useTheme();
    const [open, setOpen] = React.useState(false);

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };

    return (<>
            <CssBaseline/>
            <AppBar
                position="fixed"
                className={clsx(classes.appBar, {
                    [classes.appBarShift]: open,
                })}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerOpen}
                        edge="start"
                        className={clsx(classes.menuButton, {
                            [classes.hide]: open,
                        })}
                    >
                        <MenuIcon/>
                    </IconButton>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                className={clsx(classes.drawer, {
                    [classes.drawerOpen]: open,
                    [classes.drawerClose]: !open,
                })}
                classes={{
                    paper: clsx({
                        [classes.drawerOpen]: open,
                        [classes.drawerClose]: !open,
                    }),
                }}
            >
                <div className={classes.toolbar}>
                    <IconButton onClick={handleDrawerClose}>
                        {theme.direction === 'rtl' ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
                    </IconButton>
                </div>
                <Divider/>
                <List>
                    {props.tutorials.map((tutorial, index) => (
                        <ListItem button key={tutorial.id}>
                            <ListItemIcon><ListItemText primary={tutorial.order}/></ListItemIcon>
                            <ListItemText primary={tutorial.title}/>
                        </ListItem>
                    ))}
                </List>
            </Drawer>
        </>
    );
}


interface ExerciseProps {
    course: Course;
    tutorial: Tutorial | null;
    moveForward: () => void;
    showSignIn: () => void;
}

function CurrentExercise(props: ExerciseProps) {
    const auth = useContext(AuthContext);
    const {course, tutorial} = props;
    const pageKey = `progress-${auth?.currentUser?.uid}-${course.id}`;

    return (
        <>
            {/* Display the landing page with an option to start the course if it wasn't started yet */}
            {!tutorial && <><LandingPage introPageId={course.introduction} onStartCourseClicked={() => {
                if (auth && auth.currentUser && auth.currentUser.uid) {
                    startCourse(auth.currentUser.uid, course.id).then(() => console.log('success'));
                    localStorage.setItem(pageKey, '0');
                    props.moveForward();
                } else {
                    props.showSignIn();
                }
            }}/>
            </>}

            {/* Display the tutorial of the course at the location where it was left off the last time*/
                tutorial &&
                <SplitPane split='vertical'
                           primary='first'
                           style={{overflow: 'hidden'}}
                           defaultSize={parseInt(localStorage.getItem('splitPos') ?? '50', 10)}
                           onChange={(size) => localStorage.setItem('splitPos', size.toString(10))}>

                    <div style={{overflowY: 'scroll'}}><TutorialView tutorial={tutorial}/></div>
                    <div style={{marginTop: '80px', width: '100%'}}><Editor/></div>
                </SplitPane>
            }
        </>
    )
}

interface CourseParams {
    id: string;
}

function CourseView() {
    const classes = useStyles();
    const {id} = useParams<CourseParams>();
    const auth = useContext(AuthContext);
    const [showSignIn, setShowSignIn] = useState(false);
    const [course, setCourse] = useState<Course | null>(null);
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const pageKey = `progress-${auth?.currentUser?.uid}-${id}`;
    const [pageId, setPageId] = useState(auth?.currentUser ? localStorage.getItem(pageKey) : null);


    useAsyncEffect(async () => {
        const course = await getCourse(id);
        setCourse(course);
    }, [id]);

    useAsyncEffect(async () => {
        const tutorials = await getCourseTutorials(id);
        setTutorials(tutorials);
    }, [id]);

    const currentTutorial = course && pageId && tutorials && tutorials[parseInt(pageId)] ? tutorials[parseInt(pageId)] : null;
    console.log('current tutorial:', currentTutorial);


    return (<>
        <div className={classes.root}>
            <CourseWithDrawer tutorials={tutorials}/>

            <main className={classes.content}>
                <div className={classes.toolbar}/>
                {course &&
                <CurrentExercise course={course} tutorial={currentTutorial} moveForward={() => {
                    const current = parseInt(pageId ? pageId : '-1');
                    setPageId((current + 1).toString());
                }}
                 showSignIn={() => setShowSignIn(true)}
                />}
                <Auth showSignInOptions={showSignIn}/>
            </main>
        </div>
    </>);
}

export default CourseView;

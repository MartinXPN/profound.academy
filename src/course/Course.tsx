import React, {useContext, useState} from "react";
import {useHistory, useParams} from "react-router-dom";
import SplitPane from 'react-split-pane';

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
import Home from '@material-ui/icons/Home';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import {getCourse, startCourse} from "../services/courses";
import useAsyncEffect from "use-async-effect";
import {Course} from "../models/courses";
import LandingPage from "./LandingPage";
import {AuthContext} from "../App";
import {Tutorial} from "../models/tutorials";
import {getCourseTutorials} from "../services/tutorials";
import Editor from "./editor/Editor";
import TutorialView from "./Tutorial";
import {AppBarProfile, SignIn} from "../header/Auth";
import {useStickyState} from "../util";

const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            display: 'flex',
            height: 'calc(100vh - 64px)',
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
        tutorial: {
            overflowY: 'auto',
            height: '100%',
        },
        authIcon: {
            marginLeft: 'auto',
        }
    }),
);

interface CourseDrawerProps {
    tutorials: Tutorial[];
    currentTutorialId?: string;
    onItemSelected: (index: number) => void;
}

function CourseDrawer(props: CourseDrawerProps) {
    const classes = useStyles();
    const theme = useTheme();
    const history = useHistory();
    const [open, setOpen] = React.useState(false);

    const handleDrawerOpen = () => setOpen(true);
    const handleDrawerClose = () => setOpen(false);
    const onHomeClicked = () => history.push('/');

    const {tutorials, currentTutorialId, onItemSelected} = props;

    return (<>
            <CssBaseline/>
            <AppBar
                position="fixed"
                className={clsx(classes.appBar, {
                    [classes.appBarShift]: open,
                })}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerOpen}
                        edge="start"
                        className={clsx(classes.menuButton, {
                            [classes.hide]: open,
                        })}>
                        <MenuIcon/>
                    </IconButton>
                    <IconButton color='inherit' onClick={onHomeClicked}><Home/></IconButton>

                    <div className={classes.authIcon}><AppBarProfile/></div>
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
                }}>

                <div className={classes.toolbar}>
                    <IconButton onClick={handleDrawerClose}>
                        {theme.direction === 'rtl' ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
                    </IconButton>
                </div>
                <Divider/>
                <List>
                    {tutorials.map((tutorial, index) => (
                        <>
                        {currentTutorialId === tutorial.id && <Divider />}
                        <ListItem button key={tutorial.id} onClick={() => onItemSelected(index)}>
                            <ListItemIcon><ListItemText primary={index}/></ListItemIcon>
                            <ListItemText primary={tutorial.title}/>
                        </ListItem>
                        {currentTutorialId === tutorial.id && <Divider />}
                        </>
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
}

function CurrentExercise(props: ExerciseProps) {
    const classes = useStyles();
    const auth = useContext(AuthContext);
    const [showSignIn, setShowSignIn] = useState(false);
    const {course, tutorial, moveForward} = props;
    const [splitPos, setSplitPos] = useStickyState(50, 'splitPos');

    if(auth?.isSignedIn && showSignIn)
        setShowSignIn(false);

    return (
        <>
            {/* Display the landing page with an option to start the course if it wasn't started yet */
            (!tutorial || !auth?.isSignedIn) &&
            <><LandingPage introPageId={course.introduction} onStartCourseClicked={() => {
                if (auth && auth.currentUser && auth.currentUser.uid) {
                    startCourse(auth.currentUser.uid, course.id).then(() => console.log('success'));
                    moveForward();
                } else {
                    setShowSignIn(true);
                }
            }}/>
            </>}

            {/* Request for authentication if the user is not signed-in yet */
                showSignIn && <SignIn />
            }

            {/* Display the tutorial of the course at the location where it was left off the last time*/
            tutorial && auth?.isSignedIn && !showSignIn &&
            <SplitPane split='vertical' defaultSize={splitPos} onChange={setSplitPos}>
                <div className={classes.tutorial}>
                    <TutorialView tutorial={tutorial}/>
                </div>
                <div style={{width: '100%', height: '100%'}}><Editor/></div>
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

    const [course, setCourse] = useState<Course | null>(null);
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [pageId, setPageId] = useStickyState(-1, `page-${auth?.currentUser?.uid}-${id}`);

    const moveForward = () => setPageId(pageId + 1);
    const currentTutorial = course && pageId >= 0 && tutorials && tutorials[parseInt(pageId)] ? tutorials[parseInt(pageId)] : null;

    useAsyncEffect(async () => {
        const course = await getCourse(id);
        setCourse(course);
    }, [id, auth]);

    useAsyncEffect(async () => {
        const tutorials = await getCourseTutorials(id);
        setTutorials(tutorials);
    }, [id]);


    return (<>
        <div className={classes.root}>
            <CourseDrawer tutorials={tutorials}
                          currentTutorialId={currentTutorial?.id}
                          onItemSelected={(index) => setPageId(index.toString())} />

            <main className={classes.content}>
                <div className={classes.toolbar}/>
                {course && <CurrentExercise course={course} tutorial={currentTutorial} moveForward={moveForward}/>}
            </main>
        </div>
    </>);
}

export default CourseView;
// TODO:
//  4. make the solved exercises green
//  5. implement run/submit => upload to firebase storage
//  6. SplitPane for code/terminal
//  7. implement the dashboard for best/all submissions for a given exercise
//  8. implement editor configurations (font, language, theme)
//  9. implement a simple forum

import React, {useContext, useEffect, useState, memo} from "react";
import {useNavigate} from "react-router-dom";

import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import {Add, Home} from "@mui/icons-material";
import QueryStatsIcon from '@mui/icons-material/QueryStats';

import {Exercise} from "models/courses";
import {AppBarProfile} from "../../user/Auth";
import {Progress} from "models/courses";
import AppBarNotifications from "../../user/Notifications";
import LevelList from "./LevelList";
import {AuthContext} from "../../App";
import {onUserProgressChanged} from "../../services/progress";
import {CourseContext} from "../Course";
import Countdown from "react-countdown";
import {Typography} from "@mui/material";


const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
    width: drawerWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(9)} + 1px)`,
    },
});

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: theme.spacing(0, 2),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

const AuthDiv = styled('div')({
    marginLeft: 'auto',
});

interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
}

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...(open && {
            ...openedMixin(theme),
            '& .MuiDrawer-paper': openedMixin(theme),
        }),
        ...(!open && {
            ...closedMixin(theme),
            '& .MuiDrawer-paper': closedMixin(theme),
        }),
    }),
);


function CourseDrawer({onItemSelected, onStatusClicked, onCreateExerciseClicked}: {
    onItemSelected: (exercise: Exercise) => void,
    onStatusClicked: () => void,
    onCreateExerciseClicked: () => void,
}) {
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const theme = useTheme();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [progress, setProgress] = useState<Progress | null>(null);

    const handleDrawerOpen = () => setOpen(true);
    const handleDrawerClose = () => setOpen(false);
    const onHomeClicked = () => navigate('/');
    const isCourseInstructor = course && auth.currentUserId && course.instructors.includes(auth.currentUserId);


    useEffect(() => {
        if( !auth.currentUserId || !course?.id )
            return;
        return onUserProgressChanged(course.id, auth.currentUserId, setProgress);
    }, [course?.id, auth]);

    const renderTimeRemaining = ({days, hours, minutes, seconds}:
                                 { days: number, hours: number, minutes: number, seconds: number }) => {
        return <Typography variant="h4" paddingLeft="1em">{days * 24 + hours}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}</Typography>
    }
    const now = new Date().getTime();

    if( !course )
        return <></>
    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline/>
            <AppBar
                position="fixed"
                open={open}>
                <Toolbar>
                    <IconButton
                        key="drawerOpen"
                        color="inherit"
                        aria-label="open drawer"
                        onClick={() => open ? handleDrawerClose(): handleDrawerOpen()}
                        edge="start"
                        sx={{marginRight: '36px'}}>
                        {open ? (theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />) : <MenuIcon/>}
                    </IconButton>
                    <IconButton key="home" color="inherit" onClick={onHomeClicked} size="large"><Home/></IconButton>
                    {course.revealsAt.toDate().getTime() < now && now < course.freezeAt.toDate().getTime() &&
                        course.freezeAt.toDate().getTime() - now < 24 * 60 * 60 * 1000 && // show only if < 1 day remains
                        <Countdown date={course.freezeAt.toDate()} intervalDelay={0} precision={3} renderer={renderTimeRemaining}/> }

                    <AuthDiv key="auth">
                        <AppBarNotifications />
                        <AppBarProfile />
                    </AuthDiv>
                </Toolbar>
            </AppBar>

            <Drawer variant="permanent" open={open}>
                <DrawerHeader>
                    <Box component="span" fontWeight="fontWeightMedium">My Progress</Box>
                </DrawerHeader>

                <ListItem button onClick={onStatusClicked} key="status">
                    <ListItemIcon><QueryStatsIcon/></ListItemIcon>
                    <ListItemText primary="Status"/>
                </ListItem>
                {isCourseInstructor && <LevelList
                    drafts
                    levelNumber={-1}
                    levelStatus={'In Progress'}
                    onItemSelected={onItemSelected}
                    isDrawerOpen={open}
                    isSingleLevel={false}/>}

                {Object.entries(course.levelExercises).map(([levelName, numExercises]) => {
                    const index = parseInt(levelName) - 1;
                    const numSolved = progress && progress.levelSolved && levelName in progress.levelSolved ? progress.levelSolved[levelName] : 0;
                    const isLevelSolved = numExercises <= numSolved;

                    return <LevelList
                            levelNumber={index}
                            levelStatus={isLevelSolved ? 'Solved' : 'In Progress'}
                            onItemSelected={onItemSelected}
                            isDrawerOpen={open}
                            isSingleLevel={Object.keys(course?.levelExercises ?? {}).length <= 1}/>
                    }
                )}

                {isCourseInstructor &&
                <ListItem button onClick={onCreateExerciseClicked} key="add-exercise">
                    <ListItemIcon><Add/></ListItemIcon>
                    <ListItemText primary="Create exercise"/>
                </ListItem>}
            </Drawer>
        </Box>
    );
}

export default memo(CourseDrawer);

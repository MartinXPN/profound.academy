import {useContext, useEffect, useState, memo} from "react";
import {useNavigate} from "react-router-dom";

import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import {Add, Home} from "@mui/icons-material";
import QueryStatsIcon from '@mui/icons-material/QueryStats';

import {Exercise} from "models/exercise";
import {AppBarProfile} from "../../user/Auth";
import {Progress} from "models/progress";
import AppBarNotifications from "../../user/Notifications";
import LevelList from "./LevelList";
import {AuthContext} from "../../App";
import {onUserProgressChanged} from "../../services/progress";
import {CourseContext} from "../Course";
import Countdown from "react-countdown";
import {Divider, List, ListItem, ListItemButton, Typography} from "@mui/material";


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
    width: `calc(${theme.spacing(9)} + 1px)`,
});

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
    ...(!open && {
        marginLeft: `calc(${theme.spacing(9)} + 2px)`,
        width: `calc(100% - ${theme.spacing(9)} - 2px)`,
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
    const theme = useTheme();
    const navigate = useNavigate();
    const {course} = useContext(CourseContext);
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

    const renderTimeRemaining = ({days, hours, minutes, seconds}: {
        days: number, hours: number, minutes: number, seconds: number
    }) => <Typography variant="h4" paddingLeft="1em">
        {days * 24 + hours}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </Typography>

    const now = new Date().getTime();

    if( !course )
        return <></>
    return <>
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                color="default"
                open={open}>
                <Toolbar>
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
                <ListItem disablePadding key="home">
                    <ListItemButton onClick={onHomeClicked} sx={{height: '64px', py: 2}}>
                        <ListItemIcon><Home/></ListItemIcon>
                        <ListItemText primary="Home"/>
                    </ListItemButton>
                </ListItem>


                <List sx={{overflowY: 'auto'}}>
                <ListItem disablePadding key="status">
                    <ListItemButton onClick={onStatusClicked}>
                        <ListItemIcon><QueryStatsIcon/></ListItemIcon>
                        <ListItemText primary="Status"/>
                    </ListItemButton>
                </ListItem>
                {isCourseInstructor && <Box key="drafts">
                    <LevelList
                        drafts
                        levelName="0"
                        levelStatus={'In Progress'}
                        onItemSelected={onItemSelected}
                        isDrawerOpen={open}
                        isSingleLevel={false} />
                    <Divider />
                </Box>}

                {Object.entries(course.levelExercises).map(([levelName, numExercises]) => {
                    const numSolved = progress && progress.levelSolved && levelName in progress.levelSolved ? progress.levelSolved[levelName] : 0;
                    const isLevelSolved = numExercises <= numSolved;

                    return <Box key={`drawer-level-${levelName}`}>
                            <LevelList
                                levelName={levelName}
                                levelStatus={isLevelSolved ? 'Solved' : 'In Progress'}
                                onItemSelected={onItemSelected}
                                isDrawerOpen={open}
                                isSingleLevel={Object.keys(course?.levelExercises ?? {}).length <= 1}/>
                        </Box>
                    }
                )}

                {isCourseInstructor &&
                <ListItem disablePadding key="add-exercise">
                    <ListItemButton onClick={onCreateExerciseClicked}>
                        <ListItemIcon><Add/></ListItemIcon>
                        <ListItemText primary="Create exercise"/>
                    </ListItemButton>
                </ListItem>}

                <ListItem key="dummy" sx={{margin: 2}} />
                </List>

                {/* Open/Close the Drawer */}
                <Divider/>
                <ListItemButton
                    color="inherit"
                    onClick={() => open ? handleDrawerClose(): handleDrawerOpen()}
                    sx={{display: 'flex', justifyContent: open ? 'flex-end' : 'flex-start'}}>
                    {open
                        ? (theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />)
                        : (theme.direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon /> )
                    }
                </ListItemButton>

            </Drawer>
        </Box>
    </>
}

export default memo(CourseDrawer);

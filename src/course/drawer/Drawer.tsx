import {useContext, useEffect, useState, memo} from "react";
import {Link} from "react-router-dom";

import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import {Add, Edit, Equalizer} from "@mui/icons-material";
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
import {Button, Divider, List, ListItem, ListItemButton, Stack, SvgIcon, Tooltip, Typography} from "@mui/material";
import { ReactComponent as Logo } from "../../assets/logo.svg";
import useWindowDimensions from "../../common/windowDimensions";
import {LocalizeContext} from "../../common/Localization";


const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
    overflowX: 'hidden',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
});

const closedMixin = (theme: Theme): CSSObject => ({
    overflowX: 'hidden',
    width: `calc(${theme.spacing(9)} + 1px)`,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
});


interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
}

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer - 1,
    ...(open && {
        paddingLeft: drawerWidth,
        transition: theme.transitions.create(['width', 'padding'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
    ...(!open && {
        paddingLeft: `calc(${theme.spacing(9)} + 2px)`,
        transition: theme.transitions.create(['width', 'padding'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...(open && {...openedMixin(theme), '& .MuiDrawer-paper': openedMixin(theme)}),
        ...(!open && {...closedMixin(theme), '& .MuiDrawer-paper': closedMixin(theme)}),
    }),
);


function CourseDrawer({onItemSelected, onStatusClicked, onCreateExerciseClicked, onWidthChanged}: {
    onItemSelected: (exercise: Exercise) => void,
    onStatusClicked: () => void,
    onCreateExerciseClicked: () => void,
    onWidthChanged: (width: string) => void,
}) {
    const auth = useContext(AuthContext);
    const {localize} = useContext(LocalizeContext);
    const theme = useTheme();
    const {width} = useWindowDimensions();
    const {course} = useContext(CourseContext);
    const [open, setOpen] = useState(false);
    const [progress, setProgress] = useState<Progress | null>(null);

    const handleDrawerOpen = () => setOpen(true);
    const handleDrawerClose = () => setOpen(false);
    const isCourseInstructor = course && auth.currentUserId && course.instructors.includes(auth.currentUserId);

    // Content width based on the drawer width
    useEffect(() => {
        if( !auth.isSignedIn )  return onWidthChanged('0px');
        if( open )              onWidthChanged(`${drawerWidth}px`);
        else                    onWidthChanged(theme.spacing(9));
    }, [auth.isSignedIn, open]);

    // User progress listener
    useEffect(() => {
        if( auth.currentUserId && course?.id )
            return onUserProgressChanged(course.id, auth.currentUserId, setProgress);
    }, [course?.id, auth]);

    const renderTimeRemaining = ({hours, minutes, seconds}: {
        hours: number, minutes: number, seconds: number
    }) => <Typography variant="h4" paddingLeft="1em">
        {hours}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
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

                    {!auth.isSignedIn && <>
                        <Button component={Link} to="/">
                            <SvgIcon fontSize="large"><Logo/></SvgIcon>
                        </Button>
                    </>}

                    {width > 500 &&
                    <Typography noWrap fontSize={18} fontWeight="bold" marginX="1em">
                        {localize(course.title)}
                    </Typography>}

                    <Stack direction="row" marginLeft="auto" key="auth">
                        <AppBarNotifications />
                        <AppBarProfile />
                    </Stack>
                </Toolbar>
            </AppBar>

            {auth.isSignedIn && <Drawer variant="permanent" open={open}>
                <ListItem disablePadding key="home">
                    <ListItemButton component={Link} to="/" sx={{height: '64px'}}>
                        <ListItemIcon><SvgIcon fontSize="large"><Logo/></SvgIcon></ListItemIcon>
                        <ListItemText primary={<Typography fontWeight="bold">Profound Academy</Typography>}/>
                    </ListItemButton>
                </ListItem>

                {/* List of levels that fills up the whole vertical space (excluding the home and expand buttons) */}
                <List disablePadding sx={{overflowY: 'auto', overflowX: 'hidden', minHeight: 'calc(100% - 64px - 50px)'}}>
                <Tooltip title="Status" arrow placement="right" key="toggle-status">
                    <ListItem disablePadding key="status">
                        <ListItemButton onClick={onStatusClicked}>
                            <ListItemIcon><QueryStatsIcon/></ListItemIcon>
                            <ListItemText primary="Status"/>
                        </ListItemButton>
                    </ListItem>
                </Tooltip>

                {course.levels.map((level, levelOrder) => {
                    const numSolved = progress?.levelSolved?.[level.id] ?? 0;
                    const isLevelSolved = level.exercises <= numSolved;

                    return <Box key={`drawer-level-${level.id}`}>
                            <LevelList
                                level={level}
                                levelStatus={isLevelSolved ? 'Solved' : 'In Progress'}
                                levelOrder={levelOrder + 1}
                                levelIcon={<Equalizer/>}
                                onItemSelected={onItemSelected}
                                isDrawerOpen={open}
                                isSingleLevel={course.levels.length <= 1}/>
                        </Box>
                    }
                )}

                {isCourseInstructor && <Box key="drafts">
                    <Divider />
                    <LevelList
                        level={course.drafts}
                        levelStatus="In Progress"
                        levelIcon={<Edit/>}
                        onItemSelected={onItemSelected}
                        isDrawerOpen={open}
                        isSingleLevel={false} />

                    <Tooltip title="Create exercise" arrow placement="right" key="toggle-add-exercise">
                        <ListItem disablePadding key="add-exercise">
                            <ListItemButton onClick={onCreateExerciseClicked}>
                                <ListItemIcon><Add/></ListItemIcon>
                                <ListItemText primary="Create exercise"/>
                            </ListItemButton>
                        </ListItem>
                    </Tooltip>
                </Box>}

                <ListItem key="dummy" sx={{margin: 2}} />
                </List>

                {/* Open/Close the Drawer */}
                <Divider/>
                <ListItem disablePadding key="expand-drawer">
                    <ListItemButton
                        onClick={() => open ? handleDrawerClose(): handleDrawerOpen()}
                        sx={{display: 'flex', justifyContent: open ? 'flex-end' : 'flex-start', height: '48px'}}>
                        {open
                            ? (theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />)
                            : (theme.direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon /> )
                        }
                    </ListItemButton>
                </ListItem>
            </Drawer>}
        </Box>
    </>
}

export default memo(CourseDrawer);

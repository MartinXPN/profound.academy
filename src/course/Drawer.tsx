import React, {useEffect, useState} from "react";
import {useHistory, useParams} from "react-router-dom";

import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import {Home, ArrowDropUp, ArrowDropDown, Equalizer} from "@mui/icons-material";
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

import {Exercise} from "../models/courses";
import {AppBarProfile} from "../header/Auth";
import {Progress} from "../models/users";
import {useStatusToStyledBackground} from "./colors";
import AppBarNotifications from "../header/Notifications";
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

const AuthDiv = styled('div')(({theme}) => ({
    marginLeft: 'auto',
}));

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

function LevelList({levelNumber, exercises, progress, onItemSelected, isDrawerOpen}:
                   {levelNumber: number,
                    exercises: Exercise[],
                    progress: { [key: string]: Progress},
                    onItemSelected: (exerciseId: string) => void,
                    isDrawerOpen: boolean}) {
    const {exerciseId} = useParams<{ exerciseId?: string }>();
    const isExerciseInLevel = exercises.filter(e => e.id === exerciseId).length > 0;
    const isSingleLevel = exercises.length <= 1 || exercises.map((e, i) => i === 0 ? 0 : Math.floor(e.order) - Math.floor(exercises[i-1].order)).some(x => x > 0);
    const [open, setOpen] = useState(isExerciseInLevel || isSingleLevel);
    const statusToStyle = useStatusToStyledBackground();

    useEffect(() => {
        if( !open ) {
            setOpen(isExerciseInLevel);
        }
        // open the level if the current exercise is in this level
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exercises, isExerciseInLevel]);

    const onLevelClicked = () => setOpen(!open);
    const getStatusStyle = (id: string) => {
        const status = progress.hasOwnProperty(id) ? progress[id].status : undefined;
        if( !status )
            return statusToStyle.undefined;
        return statusToStyle[status];
    }

    let levelClass = statusToStyle.Solved;
    for( const e of exercises) {
        if( getStatusStyle(e.id) !== levelClass ) {
            levelClass = statusToStyle.undefined;
            break;
        }
    }

    return <>
        <List disablePadding>
            {!isSingleLevel &&
                <ListItem button onClick={onLevelClicked} className={levelClass}>
                    <ListItemIcon>
                        <Equalizer/>
                        {!isDrawerOpen && <Typography variant="subtitle1">{levelNumber}</Typography>}
                        {isDrawerOpen && <Typography variant="subtitle1">Level {levelNumber}</Typography>}
                        {open ? <ArrowDropUp/> : <ArrowDropDown/>}
                    </ListItemIcon>
                </ListItem>
            }
            {open && exercises.map((ex, index) =>
                <ListItem button key={ex.id} onClick={() => onItemSelected(ex.id)} className={getStatusStyle(ex.id)}>
                    <ListItemIcon>{exerciseId === ex.id ? <ArrowRightIcon /> : <ListItemText primary={index + 1}/>}</ListItemIcon>
                    <ListItemText primary={ex.title}/>
                </ListItem>
            )}
        </List>
    </>
}

interface CourseDrawerProps {
    exercises: Exercise[];
    progress: { [key: string]: Progress};
    onItemSelected: (exerciseId: string) => void;
}

function CourseDrawer(props: CourseDrawerProps) {
    const theme = useTheme();
    const history = useHistory();
    const [open, setOpen] = useState(false);
    const [levels, setLevels] = useState<Exercise[][]>([]);

    const handleDrawerOpen = () => setOpen(true);
    const handleDrawerClose = () => setOpen(false);
    const onHomeClicked = () => history.push('/');
    const {exercises, progress, onItemSelected} = props;

    // split into levels
    useEffect(() => {
        const isNewLevel = (currentExercise: Exercise, previousExercise?: Exercise) => {
            if (!previousExercise)
                return true;
            return Math.floor(currentExercise.order) - Math.floor(previousExercise.order) !== 0;
        }
        const levels = []
        let lastIndex = 0;
        exercises.forEach((ex, i) => {
            if( i !== 0 && isNewLevel(ex, exercises[i - 1]) ) {
                levels.push(exercises.slice(lastIndex, i));
                lastIndex = i;
            }
        });
        levels.push(exercises.slice(lastIndex));

        setLevels(levels);
    }, [exercises]);


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

                {levels.map((levelExercises, index) => <LevelList
                    levelNumber={index}
                    exercises={levelExercises}
                    progress={progress}
                    onItemSelected={onItemSelected}
                    isDrawerOpen={open} />)}
            </Drawer>
        </Box>
    );
}

export default CourseDrawer;

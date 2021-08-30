import React from "react";
import {useHistory} from "react-router-dom";

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
import ArrowRightIcon from '@material-ui/icons/ArrowRight';

import {Exercise} from "../models/courses";
import {AppBarProfile} from "../header/Auth";
import {Progress} from "../models/users";


const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
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
        drawerItemDone: {
            "&,&:focus,&:hover": {
                backgroundColor: "#00C02F",
            }
        },
        drawerItemFail: {
            "&,&:focus,&:hover": {
                backgroundColor: "#F09A24",
            }
        },
        drawerItemNeutral: {
            "&,&:focus,&:hover": {
                backgroundColor: "#fafafa",
            }
        },
        drawerItemUnavailable: {
            "&,&:focus,&:hover": {
                backgroundColor: "#969696",
            }
        },
        toolbar: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: theme.spacing(0, 1),
            // necessary for content to be below app bar
            ...theme.mixins.toolbar,
        },
        authIcon: {
            marginLeft: 'auto',
        }
    }),
);

interface CourseDrawerProps {
    exercises: Exercise[];
    currentExerciseId?: string;
    progress: { [key: string]: Progress};
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


    const {exercises, currentExerciseId, progress, onItemSelected} = props;
    const getClassName = (id: string) => {
        if( !progress.hasOwnProperty(id) )
            return classes.drawerItemNeutral;

        const p = progress[id];
        if(['Wrong answer', 'Time limit exceeded', 'Runtime error'].includes(p.status) )    return classes.drawerItemFail;
        if(p.status === 'Solved')                                                           return classes.drawerItemDone;
        if( p.status === 'Unavailable')                                                     return classes.drawerItemUnavailable;
    }


    return (<>
            <CssBaseline/>
            <AppBar
                position="fixed"
                className={clsx(classes.appBar, {
                    [classes.appBarShift]: open,
                })}>
                <Toolbar>
                    <IconButton
                        key="drawerOpen"
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerOpen}
                        edge="start"
                        className={clsx(classes.menuButton, {
                            [classes.hide]: open,
                        })}>
                        <MenuIcon/>
                    </IconButton>
                    <IconButton key="home" color="inherit" onClick={onHomeClicked}><Home/></IconButton>

                    <div key="auth" className={classes.authIcon}><AppBarProfile/></div>
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

                <div className={classes.toolbar} key="drawerClose">
                    <IconButton onClick={handleDrawerClose}>
                        {theme.direction === 'rtl' ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
                    </IconButton>
                </div>
                <Divider key="topDivider" />
                <List key="exerciseList">
                    {exercises.map((ex, index) => (
                        <>
                            <ListItem button key={ex.id} onClick={() => onItemSelected(index)} className={getClassName(ex.id)}>
                                <ListItemIcon>{currentExerciseId === ex.id ? <ArrowRightIcon /> : <ListItemText primary={index}/>}</ListItemIcon>
                                <ListItemText primary={ex.title}/>
                            </ListItem>
                        </>
                    ))}
                </List>
            </Drawer>
        </>
    );
}

export default CourseDrawer;

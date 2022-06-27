import {useContext, useEffect, useState, memo, ReactNode} from "react";

import List from '@mui/material/List';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import {ArrowDropUp, ArrowDropDown} from "@mui/icons-material";
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

import {Exercise} from "models/exercise";
import {ExerciseProgress} from "models/progress";
import {Level} from "models/levels";
import {statusToStyledBackground} from "../colors";
import {ListItem, ListItemButton, Stack, Tooltip, Typography} from "@mui/material";
import {onCourseLevelExercisesChanged} from "../../services/exercises";
import {onCourseExerciseProgressChanged} from "../../services/progress";
import {AuthContext} from "../../App";
import {SubmissionStatus} from "models/submissions";
import {CourseContext, CurrentExerciseContext} from "../Course";
import {useParams} from "react-router-dom";
import {LocalizeContext} from "../../common/Localization";


function LevelList({level, levelStatus, levelOrder, levelIcon, onItemSelected, isDrawerOpen, isSingleLevel}: {
    level: Level,
    levelStatus: 'Solved' | 'In Progress' | 'Unavailable',
    levelOrder?: number,
    levelIcon: ReactNode,
    onItemSelected: (exercise: Exercise) => void,
    isDrawerOpen: boolean,
    isSingleLevel: boolean,
}) {
    const auth = useContext(AuthContext);
    const {exerciseId} = useParams<{ exerciseId: string }>();
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);
    const {localize} = useContext(LocalizeContext);
    const [levelExercises, setLevelExercises] = useState<Exercise[]>([]);
    const [open, setOpen] = useState(isSingleLevel);
    const [progress, setProgress] = useState<ExerciseProgress<SubmissionStatus> | null>(null);
    const isCourseOpen = course && course.revealsAt.toDate() < new Date();

    // Open the level in the drawer
    useEffect(() => {
        if( isSingleLevel )
            return setOpen(true);
        if( !exercise )
            return;
        const isExerciseInLevel = exercise.levelId === level.id;

        if( !open )
            setOpen(isExerciseInLevel);
        // intentionally leave out open - because we might want to close the level by clicking
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exercise, level.id, isSingleLevel]);

    // Level exercise listener
    useEffect(() => {
        if( course && open )
            return onCourseLevelExercisesChanged(course.id, level.id, setLevelExercises);
    }, [course, open, level.id, isCourseOpen]);

    // Level exercises progress listener
    useEffect(() => {
        if( open && auth.currentUserId && course?.id )
            return onCourseExerciseProgressChanged(course.id, auth.currentUserId, level.id, setProgress);
    }, [open, level.id, auth.currentUserId, course?.id, isCourseOpen]);

    // Current exercise data update
    useEffect(() => levelExercises.forEach(exercise => {
        if (exercise.id === exerciseId)
            onItemSelected(exercise);
    }), [levelExercises, exerciseId]);


    const onLevelClicked = () => setOpen(!open);
    const getStatusStyle = (id: string) => {
        if( !progress )
            return statusToStyledBackground.undefined;

        const status = progress.progress?.[id];
        if( !status )
            return statusToStyledBackground.undefined;
        return statusToStyledBackground[status];
    }

    const levelStyle = levelStatus === 'Solved' ? statusToStyledBackground.Solved : statusToStyledBackground.undefined;
    return <>
        <List disablePadding>
            {!isSingleLevel &&
                <Tooltip title={localize(level.title)} arrow placement="right" key={`toggle-${level.id}`}>
                    <ListItem disablePadding key={`level-${level.id}`} sx={{width: '100%'}}>
                        <ListItemButton onClick={onLevelClicked} style={levelStyle}>
                            <ListItemIcon sx={{maxWidth: '100%'}}>
                                {levelIcon}
                                {levelOrder && <Typography variant="subtitle1" noWrap>{levelOrder}</Typography>}
                                {isDrawerOpen && <Typography variant="subtitle1" noWrap flex={1}>&nbsp; • &nbsp;{localize(level.title)}</Typography>}
                                {open ? <ArrowDropUp/> : <ArrowDropDown/>}
                            </ListItemIcon>
                        </ListItemButton>
                    </ListItem>
                </Tooltip>
            }
            {open && levelExercises.map((ex, index) => {
                const isCurrent = exerciseId === ex.id;
                return <>
                    <Tooltip title={localize(ex.title)} arrow placement="right" key={`toggle-${ex.id}`}>
                        <ListItem disablePadding key={`level-ex-${ex.id}`}>
                            <ListItemButton onClick={() => onItemSelected(ex)} sx={getStatusStyle(ex.id)} selected={isCurrent}>
                                <ListItemIcon>
                                    {isCurrent
                                        ? <Stack direction="row" alignItems="center" alignContent="center">
                                            <ListItemText primary={index + 1}/>
                                            <ArrowRightIcon sx={{color: 'rgba(0,0,0,0.36)'}} />
                                        </Stack>
                                        : <ListItemText primary={index + 1}/>}
                                </ListItemIcon>
                                <ListItemText primary={localize(ex.title)}/>
                            </ListItemButton>
                        </ListItem>
                    </Tooltip>
                </>
            })}
        </List>
    </>
}


export default memo(LevelList);

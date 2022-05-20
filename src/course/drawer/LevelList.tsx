import React, {useContext, useEffect, useState, memo} from "react";

import List from '@mui/material/List';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import {ArrowDropUp, ArrowDropDown, Equalizer, Edit} from "@mui/icons-material";
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

import {Exercise} from "models/exercise";
import {ExerciseProgress} from "models/progress";
import {statusToStyledBackground} from "../colors";
import {ListItemButton, Stack, Typography} from "@mui/material";
import {onCourseLevelExercisesChanged} from "../../services/exercises";
import {onCourseExerciseProgressChanged} from "../../services/progress";
import {AuthContext} from "../../App";
import {SubmissionStatus} from "models/submissions";
import {CourseContext, CurrentExerciseContext} from "../Course";
import {useParams} from "react-router-dom";
import {LocalizeContext} from "../../common/Localization";


function LevelList({levelName, levelStatus, onItemSelected, isDrawerOpen, isSingleLevel, drafts}: {
    levelName: string,
    levelStatus: 'Solved' | 'In Progress' | 'Unavailable',
    onItemSelected: (exercise: Exercise) => void,
    isDrawerOpen: boolean,
    isSingleLevel: boolean,
    drafts?: boolean,
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
    const levelNumber = parseInt(levelName);

    useEffect(() => {
        if( isSingleLevel ) {
            setOpen(true);
            return;
        }
        if( !exercise )
            return;
        const exerciseLevel = Math.trunc(exercise.order).toString();
        const isExerciseInLevel = exerciseLevel === levelName;

        if( !open )
            setOpen(isExerciseInLevel);
        // intentionally leave out open - because we might want to close the level by clicking
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exercise, levelName, isSingleLevel]);

    useEffect(() => {
        if( !course || !open )
            return;

        return onCourseLevelExercisesChanged(course.id, levelNumber, (exercises => {
            setLevelExercises(exercises);
            const cur = exercises.filter(e => e.id === exerciseId);
            if( cur.length === 1 && exerciseId === cur[0].id )
                onItemSelected(cur[0]);
        }));
    }, [course, exerciseId, onItemSelected, open, levelNumber, isCourseOpen]);

    useEffect(() => {
        if( !open || !auth.currentUserId || !course )
            return;

        return onCourseExerciseProgressChanged(course.id, auth.currentUserId, levelName, setProgress);
    }, [open, levelName, auth, course, isCourseOpen]);

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
                <ListItemButton key={`level-${levelName}`} onClick={onLevelClicked} style={levelStyle}>
                    {drafts
                    ? <ListItemIcon>
                            <Edit/>
                            {isDrawerOpen && <Typography variant="subtitle1">Drafts</Typography>}
                            {open ? <ArrowDropUp/> : <ArrowDropDown/>}
                        </ListItemIcon>
                    : <ListItemIcon>
                        <Equalizer/>
                        {!isDrawerOpen && <Typography variant="subtitle1">{levelName}</Typography>}
                        {isDrawerOpen && <Typography variant="subtitle1">Level {levelName}</Typography>}
                        {open ? <ArrowDropUp/> : <ArrowDropDown/>}
                    </ListItemIcon>}
                </ListItemButton>
            }
            {open && levelExercises.map((ex, index) => {
                const isCurrent = exerciseId === ex.id;
                return <>
                    <ListItemButton key={ex.id} onClick={() => onItemSelected(ex)} sx={getStatusStyle(ex.id)} selected={isCurrent}>
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
                </>
            })}
        </List>
    </>
}


export default memo(LevelList);

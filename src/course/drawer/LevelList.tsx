import React, {useContext, useEffect, useState, memo} from "react";

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import {ArrowDropUp, ArrowDropDown, Equalizer, Edit} from "@mui/icons-material";
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

import {Exercise, ExerciseProgress} from "models/courses";
import {statusToStyledBackground} from "../colors";
import {Typography} from "@mui/material";
import {onCourseLevelExercisesChanged} from "../../services/exercises";
import {onCourseExerciseProgressChanged} from "../../services/progress";
import {AuthContext} from "../../App";
import {SubmissionStatus} from "models/submissions";
import {CourseContext, CurrentExerciseContext} from "../Course";
import {getLocalizedParam} from '../../util';


function LevelList({levelNumber, levelStatus, onItemSelected, isDrawerOpen, isSingleLevel, drafts}: {
    levelNumber: number,
    levelStatus: 'Solved' | 'In Progress' | 'Unavailable',
    onItemSelected: (exercise: Exercise) => void,
    isDrawerOpen: boolean,
    isSingleLevel: boolean,
    drafts?: boolean,
}) {
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);
    const [levelExercises, setLevelExercises] = useState<Exercise[]>([]);
    const [open, setOpen] = useState(isSingleLevel);
    const [progress, setProgress] = useState<ExerciseProgress<SubmissionStatus> | null>(null);
    const isCourseOpen = course && course.revealsAt.toDate() < new Date();

    useEffect(() => {
        if( !exercise )
            return;
        const isExerciseInLevel = levelNumber + 1 <= exercise.order && exercise.order < levelNumber + 2;

        if( !open )
            setOpen(isExerciseInLevel);
        // intentionally leave out open - because we might want to close the level by clicking
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exercise, levelNumber]);

    useEffect(() => {
        if( !course || !open )
            return;

        return onCourseLevelExercisesChanged(course.id, levelNumber + 1, setLevelExercises);
    }, [course, open, levelNumber, isCourseOpen]);

    useEffect(() => {
        if( !open || !auth.currentUserId || !course )
            return;

        return onCourseExerciseProgressChanged(course.id, auth.currentUserId, (levelNumber + 1).toString(), setProgress);
    }, [open, levelNumber, auth, course, isCourseOpen]);

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
                <ListItem button key={`level-${levelNumber}`} onClick={onLevelClicked} style={levelStyle}>
                    {drafts
                    ? <ListItemIcon>
                            <Edit/>
                            {isDrawerOpen && <Typography variant="subtitle1">Drafts</Typography>}
                            {open ? <ArrowDropUp/> : <ArrowDropDown/>}
                        </ListItemIcon>
                    : <ListItemIcon>
                        <Equalizer/>
                        {!isDrawerOpen && <Typography variant="subtitle1">{levelNumber}</Typography>}
                        {isDrawerOpen && <Typography variant="subtitle1">Level {levelNumber}</Typography>}
                        {open ? <ArrowDropUp/> : <ArrowDropDown/>}
                    </ListItemIcon>}
                </ListItem>
            }
            {open && levelExercises.map((ex, index) =>
                <ListItem button key={ex.id} onClick={() => onItemSelected(ex)} style={getStatusStyle(ex.id)}>
                    <ListItemIcon>{exercise?.id === ex.id ? <ArrowRightIcon /> : <ListItemText primary={index + 1}/>}</ListItemIcon>
                    <ListItemText primary={getLocalizedParam(ex.title)}/>
                </ListItem>
            )}
        </List>
    </>
}


export default memo(LevelList);

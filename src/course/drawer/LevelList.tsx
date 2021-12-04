import React, {useContext, useEffect, useState} from "react";

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import {ArrowDropUp, ArrowDropDown, Equalizer} from "@mui/icons-material";
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

import {Exercise, ExerciseProgress} from "../../models/courses";
import {useStatusToStyledBackground} from "../colors";
import {Typography} from "@mui/material";
import {getCourseLevelExercises, onCourseExerciseProgressChanged} from "../../services/courses";
import {AuthContext} from "../../App";
import {SubmissionStatus} from "../../models/submissions";
import {CourseContext, CurrentExerciseContext} from "../Course";
import useAsyncEffect from "use-async-effect";


export default function LevelList({levelNumber, levelStatus, onItemSelected, isDrawerOpen, isSingleLevel}:
                       {
                           levelNumber: number,
                           levelStatus: 'Solved' | 'In Progress' | 'Unavailable',
                           onItemSelected: (exercise: Exercise) => void,
                           isDrawerOpen: boolean,
                           isSingleLevel: boolean
                       }) {
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);
    const [levelExercises, setLevelExercises] = useState<Exercise[]>([]);
    const [open, setOpen] = useState(false);
    const [progress, setProgress] = useState<ExerciseProgress<SubmissionStatus> | null>(null);
    const statusToStyle = useStatusToStyledBackground();

    useEffect(() => {
        if( !exercise )
            return;
        const isExerciseInLevel = levelNumber + 1 <= exercise.order && exercise.order < levelNumber + 2;

        if( isSingleLevel && levelExercises.length > 0 )
            setOpen(true);
        else if( !open )
            setOpen(isExerciseInLevel);

    }, [levelExercises, exercise, open, isSingleLevel]);

    useAsyncEffect(async () => {
        if( !course || !open )
            return;
        const exercises = await getCourseLevelExercises(course.id, levelNumber + 1);
        setLevelExercises(exercises);
    }, [course, open, levelNumber]);

    useEffect(() => {
        if( !open || !auth.currentUserId || !course )
            return;

        return onCourseExerciseProgressChanged(course.id, auth.currentUserId, (levelNumber + 1).toString(), progress => {
            setProgress(progress);
        });
    }, [open, levelNumber, auth, course]);

    const onLevelClicked = () => setOpen(!open);
    const getStatusStyle = (id: string) => {
        if( !progress )
            return statusToStyle.undefined;

        const status = id in progress.progress ? progress.progress[id] : undefined;
        if( !status )
            return statusToStyle.undefined;
        return statusToStyle[status];
    }

    const levelClass = levelStatus === 'Solved' ? statusToStyle.Solved : statusToStyle.undefined;
    return <>
        <List disablePadding>
            {!isSingleLevel &&
                <ListItem button key={`level-${levelNumber}`} onClick={onLevelClicked} className={levelClass}>
                    <ListItemIcon>
                        <Equalizer/>
                        {!isDrawerOpen && <Typography variant="subtitle1">{levelNumber}</Typography>}
                        {isDrawerOpen && <Typography variant="subtitle1">Level {levelNumber}</Typography>}
                        {open ? <ArrowDropUp/> : <ArrowDropDown/>}
                    </ListItemIcon>
                </ListItem>
            }
            {open && levelExercises.map((ex, index) =>
                <ListItem button key={ex.id} onClick={() => onItemSelected(ex)} className={getStatusStyle(ex.id)}>
                    <ListItemIcon>{exercise?.id === ex.id ? <ArrowRightIcon /> : <ListItemText primary={index + 1}/>}</ListItemIcon>
                    <ListItemText primary={ex.title}/>
                </ListItem>
            )}
        </List>
    </>
}

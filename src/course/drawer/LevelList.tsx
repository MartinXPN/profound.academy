import React, {useContext, useEffect, useState} from "react";
import {useParams} from "react-router-dom";

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import {ArrowDropUp, ArrowDropDown, Equalizer} from "@mui/icons-material";
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

import {Exercise, ExerciseProgress} from "../../models/courses";
import {useStatusToStyledBackground} from "../colors";
import {Typography} from "@mui/material";
import {onCourseExerciseProgressChanged} from "../../services/courses";
import {AuthContext} from "../../App";
import {SubmissionStatus} from "../../models/submissions";


export default function LevelList({levelNumber, levelStatus, exercises, onItemSelected, isDrawerOpen, isSingleLevel}:
                       {
                           levelNumber: number,
                           levelStatus: 'Solved' | 'In Progress' | 'Unavailable',
                           exercises: Exercise[],
                           onItemSelected: (exerciseId: string) => void,
                           isDrawerOpen: boolean,
                           isSingleLevel: boolean
                       }) {
    const auth = useContext(AuthContext);
    const {exerciseId} = useParams<{ exerciseId?: string }>();
    const isExerciseInLevel = exercises.filter(e => e.id === exerciseId).length > 0;
    const [open, setOpen] = useState(isExerciseInLevel || isSingleLevel);
    const [progress, setProgress] = useState<ExerciseProgress<SubmissionStatus> | null>(null);
    const statusToStyle = useStatusToStyledBackground();

    useEffect(() => {
        if( isSingleLevel )
            setOpen(true);
        else if( !isSingleLevel && open && !isExerciseInLevel ) {
            setOpen(false);
        }
        else if( !open ) {
            setOpen(isExerciseInLevel);
        }
        // open the level if the current exercise is in this level
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exercises, isExerciseInLevel, isSingleLevel]);

    useEffect(() => {
        if( !open || !auth.currentUserId )
            return;

        return onCourseExerciseProgressChanged('competitive-contest-0002', auth.currentUserId, (levelNumber + 1).toString(), progress => {
            setProgress(progress);
        });
    }, [open, levelNumber, auth]);

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
            {open && exercises.map((ex, index) =>
                <ListItem button key={ex.id} onClick={() => onItemSelected(ex.id)} className={getStatusStyle(ex.id)}>
                    <ListItemIcon>{exerciseId === ex.id ? <ArrowRightIcon /> : <ListItemText primary={index + 1}/>}</ListItemIcon>
                    <ListItemText primary={ex.title}/>
                </ListItem>
            )}
        </List>
    </>
}

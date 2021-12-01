import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import {ArrowDropUp, ArrowDropDown, Equalizer} from "@mui/icons-material";
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

import {Exercise} from "../../models/courses";
import {Progress} from "../../models/users";
import {useStatusToStyledBackground} from "../colors";
import {Typography} from "@mui/material";


export default function LevelList({levelNumber, exercises, progress, onItemSelected, isDrawerOpen, isSingleLevel}:
                       {
                           levelNumber: number,
                           exercises: Exercise[],
                           progress: { [key: string]: Progress },
                           onItemSelected: (exerciseId: string) => void,
                           isDrawerOpen: boolean,
                           isSingleLevel: boolean
                       }) {
    const {exerciseId} = useParams<{ exerciseId?: string }>();
    const isExerciseInLevel = exercises.filter(e => e.id === exerciseId).length > 0;
    const [open, setOpen] = useState(isExerciseInLevel || isSingleLevel);
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

    const onLevelClicked = () => setOpen(!open);
    const getStatusStyle = (id: string) => {
        const status = id in progress ? progress[id].status : undefined;
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

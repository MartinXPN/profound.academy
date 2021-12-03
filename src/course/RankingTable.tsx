import React, {useContext, useEffect, useState} from "react";
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import {Exercise, Progress} from "../models/courses";
import {getCourseLevelExercises, onLevelExerciseProgressChanged, onProgressChanged} from "../services/courses";
import {CourseContext} from "./Course";
import {Equalizer} from "@mui/icons-material";
import {Typography} from "@mui/material";
import useAsyncEffect from "use-async-effect";


function RankingTable({metric}: {metric: 'score' | 'solved' | 'upsolveScore'}) {
    const {course} = useContext(CourseContext);
    const [page, setPage] = useState(0);
    const rowsPerPage = 20;
    const [progress, setProgress] = useState<Progress[]>([]);
    const [maxLevel, setMaxLevel] = useState(0);
    const [levelOpen, setLevelOpen] = useState<{[key: string]: boolean}>({});
    const [levelExerciseProgress, setLevelExerciseProgress] = useState<{[key: string]: {[key: string]: {[key: string]: number}}}>({});
    const [levelExercises, setLevelExercises] = useState<{[key: string]: Exercise[]}>({});

    const uppercaseMetric = metric.charAt(0).toUpperCase() + metric.slice(1);
    const levelMetric = 'level' + uppercaseMetric;
    const exerciseMetric = 'exercise' + uppercaseMetric;
    if( exerciseMetric !== 'exerciseScore' && exerciseMetric !== 'exerciseUpsolveScore' && exerciseMetric !== 'exerciseSolved' )
        throw Error(`wrong exercise metric: ${exerciseMetric}`)

    useEffect(() => {
        if( !course )
            return;
        return onProgressChanged(course.id, metric, progress => {
            setProgress(progress);
            // @ts-ignore
            const maxLevel = progress.map(p => levelMetric in p ? p[levelMetric] as number : {'1': 0})
                .map(scores => scores ? Object.keys(scores)
                    .map(level => parseInt(level))
                    .reduce((prev, cur) => Math.max(prev, cur)) : 0)
                .reduce((prev, cur) => Math.max(prev, cur));

            setMaxLevel(maxLevel);

            // single-level rankings should always be open
            console.log('maxLevel:', maxLevel);
            if( maxLevel === 1 )
                setLevelOpen({...levelOpen, '1': true});
        });
    }, [course, metric, levelMetric]);


    useAsyncEffect(async () => {
        if( !course )
            return;

        const current = {...levelExerciseProgress};
        const unsubscribe: {[key: string]: (() => void)} = {};
        for( const [level, isOpen] of Object.entries(levelOpen) ) {
            if( !isOpen )
                continue;

            if( !(level in levelExercises) ) {
                const levelEx = await getCourseLevelExercises(course.id, parseInt(level));
                const res = {...levelExercises, [level]: levelEx};
                setLevelExercises(res);
            }

            console.log(`${level} is open! getting metric: ${exerciseMetric}`);
            unsubscribe[level] = onLevelExerciseProgressChanged<number>(course.id, level, exerciseMetric, userIdToProgress => {
                Object.entries(userIdToProgress).forEach(([userId, progress]) => {
                    if (!(level in current))
                        current[level] = {}
                    current[level][userId] = progress;
                });
            });
        }

        console.log('current unsubscribe:', unsubscribe);
        console.log('current exercise progress:', current);
        setLevelExerciseProgress(current);

        return () => {
            Object.entries(unsubscribe).forEach(([level, u]) => {
                console.log(`unsubscribing... ${level}`);
                u();
            });
        }
    }, [course, levelOpen, exerciseMetric]);


    const onLevelClicked = (level: number) => {
        const levelName = (level + 1).toString();
        console.log(`level ${levelName} clicked!`);
        if( !(levelName in levelOpen) || !levelOpen[levelName] )
            setLevelOpen({...levelOpen, [levelName]: true});
        else
            setLevelOpen({...levelOpen, [levelName]: false});
    }


    return (
        <Paper sx={{width: '100%'}}>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell key="#" align="center" style={{minWidth: 20}}>#</TableCell>
                            <TableCell key="userDisplayName" align="left" style={{minWidth: 100}}>User</TableCell>
                            <TableCell key="total" align="right" style={{width: 50}}>Total</TableCell>

                            {(maxLevel >= 1) && Array(maxLevel).fill(1).map((_, level) => {
                                const levelName = (level + 1).toString();
                                return <>
                                    {maxLevel >= 2 && <TableCell key={level} align="right" style={{width: 50}} onClick={() => onLevelClicked(level)} sx={{"&:focus,&:hover": {cursor: 'pointer'}}}>
                                        <Typography variant="subtitle1" sx={{verticalAlign: 'middle', display: 'inline-flex'}}>
                                            <Equalizer /> {level}
                                        </Typography>
                                    </TableCell>}

                                    {levelOpen[levelName] && levelName in levelExercises && levelExercises[levelName].map((ex, index) =>
                                        <TableCell key={ex.id} align="right" style={{width: 50}}>
                                            {index + 1}
                                        </TableCell>)
                                    }
                                </>
                            })}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {progress.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) =>
                        <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                            <TableCell key="#" align="center">{page * rowsPerPage + index + 1}</TableCell>
                            <TableCell key="userDisplayName" align="left">{row.userDisplayName}</TableCell>
                            { /* @ts-ignore */ }
                            <TableCell key="total" align="right">{metric in row ? row[metric].toFixed(0): '-' }</TableCell>

                            {(maxLevel >= 1) && Array(maxLevel).fill(1).map((_, level) => {
                                const levelName = (level + 1).toString();
                                return <>
                                    {maxLevel >= 2 && <TableCell key={levelName} align="right">
                                        { /* @ts-ignore */}
                                        {levelMetric in row && levelName in row[levelMetric] ? row[levelMetric][levelName].toFixed(0) : '-'}
                                    </TableCell>}


                                    {levelOpen[(level + 1).toString()] && (level + 1).toString() in levelExercises && levelExercises[(level + 1).toString()].map(ex =>
                                        <TableCell key={ex.id} align="right">
                                            {levelName in levelExerciseProgress && row.id in levelExerciseProgress[levelName] && ex.id in levelExerciseProgress[levelName][row.id] ? levelExerciseProgress[levelName][row.id][ex.id].toFixed(0) : '-'}
                                        </TableCell>)
                                    }
                                </>
                            })}
                        </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}

export default RankingTable;

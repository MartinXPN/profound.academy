import React, {memo, useCallback, useContext, useEffect, useState} from "react";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import {Exercise, Progress} from "models/courses";
import {getCourseLevelExercises, onLevelExerciseProgressChanged, onProgressChanged} from "../services/courses";
import {CourseContext} from "./Course";
import {Equalizer} from "@mui/icons-material";
import {Stack, Typography} from "@mui/material";
import useAsyncEffect from "use-async-effect";
import {useNavigate} from "react-router-dom";
import ClickableTableCell from "../common/ClickableTableCell";
import SmallAvatar from "../common/SmallAvatar";
import {statusColors} from "./colors";


function RankingTable({metric, showProgress}: {metric: string, showProgress?: boolean}) {
    const navigate = useNavigate();
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

    useEffect(() => {
        if( !course )
            return;
        return onProgressChanged(course.id, metric, progress => {
            setProgress(progress);
            // @ts-ignore
            const maxLevel = progress.map(p => levelMetric in p ? p[levelMetric] as number : {'1': 0})
                .map(scores => scores
                    ? Object.keys(scores)
                        .map(level => parseInt(level))
                        .reduce((prev, cur) => Math.max(prev, cur), 0)
                    : 0)
                .reduce((prev, cur) => Math.max(prev, cur), 0);

            setMaxLevel(maxLevel);

            // single-level rankings should always be open
            if( maxLevel <= 1 )
                setLevelOpen(lOpen => {return {...lOpen, '1': true}});
        });
    }, [course, metric, levelMetric]);


    useAsyncEffect(async () => {
        if( !course )
            return;

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
                const current: {[key: string]: {[key: string]: number}} = {};
                Object.entries(userIdToProgress).forEach(([userId, progress]) => {
                    current[userId] = progress;
                });
                setLevelExerciseProgress({...levelExerciseProgress, [level]: current});
            });
        }

        return () => {
            Object.entries(unsubscribe).forEach(([level, u]) => {
                console.log(`unsubscribing... ${level}`);
                u();
            });
        }
    }, unsubscribe => unsubscribe && unsubscribe(), [course, levelOpen, exerciseMetric]);

    const onUserClicked = useCallback((userId: string) => {
        navigate(`/users/${userId}`);
    }, [navigate]);


    const onLevelClicked = useCallback((level: number) => {
        const levelName = (level + 1).toString();
        console.log(`level ${levelName} clicked!`);
        if( !(levelName in levelOpen) || !levelOpen[levelName] )
            setLevelOpen({...levelOpen, [levelName]: true});
        else
            setLevelOpen({...levelOpen, [levelName]: false});
    }, [levelOpen]);


    return (
        <TableContainer sx={{ maxHeight: 'calc(100vh - 64px)', width: '100%' }}>
            <Table stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell key="#" align="center" sx={{minWidth: 20}}>#</TableCell>
                        <TableCell key="userDisplayName" align="left" sx={{minWidth: 100}}>User</TableCell>
                        <TableCell key="total" align="right" sx={{width: 50}}>Total</TableCell>

                        {(maxLevel >= 1) && Array(maxLevel).fill(1).map((_, level) => {
                            const levelName = (level + 1).toString();
                            return <>
                                {maxLevel >= 2 &&
                                <TableCell key={level} align="right" onClick={() => onLevelClicked(level)} sx={{"&:focus,&:hover": {cursor: 'pointer'}, width: 50}}>
                                    <Typography variant="subtitle1" sx={{verticalAlign: 'middle', display: 'inline-flex'}}>
                                        <Equalizer /> {level}
                                    </Typography>
                                    <Typography variant="body2">
                                        {course && course?.levelExercises && course.levelExercises[levelName] ? course.levelExercises[levelName] * 100 : '?'}
                                    </Typography>
                                </TableCell>}

                                {levelOpen[levelName] && levelName in levelExercises && levelExercises[levelName].map((ex, index) =>
                                    <TableCell key={ex.id} align="right" sx={{width: 50}}>
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
                        <ClickableTableCell key="userDisplayName" align="left" onClick={() => onUserClicked(row.id)}>
                            <Stack direction="row" alignItems="center" alignContent="center">
                                <SmallAvatar src={row.userImageUrl} />
                                {row.userDisplayName}
                            </Stack>
                        </ClickableTableCell>
                        <TableCell key="total" align="right" sx={{color: showProgress ? statusColors.solved: 'standard', fontWeight: 'bold'}}>
                            { /* @ts-ignore */ }
                            {showProgress ? '+' : ''}{metric in row ? row[metric].toFixed(0): '-' }
                        </TableCell>

                        {(maxLevel >= 1) && Array(maxLevel).fill(1).map((_, level) => {
                            const levelName = (level + 1).toString();
                            // @ts-ignore
                            const levelScore = row?.[levelMetric]?.[levelName];
                            return <>
                                {maxLevel >= 2 &&
                                <TableCell key={levelName} align="right">
                                    {levelScore ? levelScore.toFixed(0) : '-'}
                                </TableCell>}


                                {levelOpen[levelName] && levelName in levelExercises && levelExercises[levelName].map(ex => {
                                    const exerciseScore = levelExerciseProgress?.[levelName]?.[row.id]?.[ex.id];
                                    return <>
                                        <TableCell key={ex.id} align="right">
                                            {exerciseScore ? exerciseScore.toFixed(0) : '-'}
                                        </TableCell>
                                    </>
                                })}
                            </>
                        })}
                    </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default memo(RankingTable);

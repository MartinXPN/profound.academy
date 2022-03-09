import React, {memo, useCallback, useContext, useEffect, useMemo, useState} from "react";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import {Exercise, Progress} from "models/courses";
import {onLevelExerciseProgressChanged, onProgressChanged} from "../services/progress";
import {getCourseLevelExercises} from "../services/exercises";
import {CourseContext} from "./Course";
import {Equalizer} from "@mui/icons-material";
import {Stack, Typography} from "@mui/material";
import useAsyncEffect from "use-async-effect";
import {useNavigate} from "react-router-dom";
import ClickableTableCell from "../common/ClickableTableCell";
import SmallAvatar from "../common/SmallAvatar";
import {statusColors} from "./colors";


function RankingPage({metric, numRows, startAfterId, startIndex, showProgress, levelOpen, maxLevel, levelExercises}: {
    metric: string, numRows: number, startAfterId: string | null, startIndex: number,
    showProgress?: boolean,
    levelOpen: {[key: string]: boolean}, maxLevel: number,
    levelExercises: {[key: string]: Exercise[]},
}) {
    const navigate = useNavigate();
    const {course} = useContext(CourseContext);
    const [progress, setProgress] = useState<Progress[]>([]);
    const [userIds, setUserIds] = useState<string[]>([]);
    const [levelExerciseProgress, setLevelExerciseProgress] = useState<{[key: string]: {[key: string]: {[key: string]: number}}}>({});

    const uppercaseMetric = metric.charAt(0).toUpperCase() + metric.slice(1);
    const levelMetric = 'level' + uppercaseMetric;
    const exerciseMetric = 'exercise' + uppercaseMetric;

    const onUserClicked = useCallback((userId: string) => navigate(`/users/${userId}`), [navigate]);

    useEffect(() => {
        if( !course )
            return;
        return onProgressChanged(course.id, metric, startAfterId, numRows, progress => {
            setUserIds(progress.map(p => p.id));
            setProgress(progress);
        });
    }, [course, metric, levelMetric, startAfterId, numRows]);

    useAsyncEffect(async () => {
        if( !course )
            return;

        const unsubscribe: {[key: string]: (() => void)} = {};
        for( const [level, isOpen] of Object.entries(levelOpen) ) {
            if( !isOpen )
                continue;

            console.log(`${level} is open! getting metric: ${exerciseMetric}`);
            unsubscribe[level] = onLevelExerciseProgressChanged<number>(course.id, level, exerciseMetric, userIds, userIdToProgress => {
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
    }, unsubscribe => unsubscribe && unsubscribe(), [course, levelOpen, exerciseMetric, startAfterId, numRows]);

    return <>
        {progress.map((row, index) =>
            <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                <TableCell key="#" align="center">{startIndex + index}</TableCell>
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

                {(maxLevel >= 1) && Array(maxLevel).fill(1).map((_, index) => {
                    const levelName = (index + 1).toString();
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
    </>
}

function RankingTable({metric, showProgress}: {metric: string, showProgress?: boolean}) {
    const {course} = useContext(CourseContext);
    const [maxLevel, setMaxLevel] = useState(0);
    const [levelOpen, setLevelOpen] = useState<{[key: string]: boolean}>({});
    const [levelExercises, setLevelExercises] = useState<{[key: string]: Exercise[]}>({});

    useMemo(() => {
        if( !course )
            return;
        const maxLevel = Object.keys(course.levelExercises)
            .map(k => parseInt(k))
            .reduce((prev, cur) => Math.max(prev, cur), 1);
        setMaxLevel(maxLevel);

        // single-level rankings should always be open
        if( maxLevel <= 1 )
            setLevelOpen(lOpen => {return {...lOpen, '1': true}});
    }, [course]);

    useAsyncEffect(async () => {
        if( !course )
            return;

        return await Promise.all(Object.entries(levelOpen).map(async ([level, isOpen]) => {
            if( !isOpen )
                return null;
            if( level in levelExercises )
                return levelExercises[level];

            const levelEx = await getCourseLevelExercises(course.id, parseInt(level));
            setLevelExercises(levelExercises => {return {...levelExercises, [level]: levelEx}});
        }));
    }, [course, levelOpen]);

    const onLevelClicked = useCallback((levelName: string) => {
        const open = !(levelName in levelOpen) || !levelOpen[levelName];
        console.log(`level ${levelName} clicked! => setting open: ${open}`);
        setLevelOpen({...levelOpen, [levelName]: open});
    }, [levelOpen]);


    return (
        <TableContainer sx={{ maxHeight: 'calc(100vh - 64px)', width: '100%' }}>
            <Table stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell key="#" align="center" sx={{minWidth: 20}}>#</TableCell>
                        <TableCell key="userDisplayName" align="left" sx={{minWidth: 100}}>User</TableCell>
                        <TableCell key="total" align="right" sx={{width: 50}}>Total</TableCell>

                        {(maxLevel >= 1) && Array(maxLevel).fill(1).map((_, index) => {
                            const levelName = (index + 1).toString();
                            return <>
                                {maxLevel >= 2 &&
                                <TableCell key={levelName} align="right" onClick={() => onLevelClicked(levelName)} sx={{"&:focus,&:hover": {cursor: 'pointer'}, width: 50}}>
                                    <Typography variant="subtitle1" sx={{verticalAlign: 'middle', display: 'inline-flex'}}>
                                        <Equalizer /> {levelName}
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
                    <RankingPage
                        // Firestore 'in' filters support a maximum of 10 elements in the value array
                        metric={metric} numRows={10} startAfterId={null} startIndex={1}
                        showProgress={showProgress}
                        levelOpen={levelOpen} maxLevel={maxLevel} levelExercises={levelExercises} />
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default memo(RankingTable);

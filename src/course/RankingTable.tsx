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
import {BottomLoading} from "../common/loading";
import {statusColors} from "./colors";


function RankingPage({metric, numRows, startAfterId, startIndex, showProgress, levelOpen, maxLevel, levelExercises, setCurrentUserIds}: {
    metric: string, numRows: number, startAfterId: string | null, startIndex: number,
    showProgress?: boolean,
    levelOpen: {[key: string]: boolean}, maxLevel: number,
    levelExercises: {[key: string]: Exercise[]},
    setCurrentUserIds: (userIds: string[]) => void,
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

    useAsyncEffect(async () => {
        if( !course?.id )
            return;
        return onProgressChanged(course.id, metric, startAfterId, numRows, progress => {
            const userIds = progress.map(p => p.id)
            setUserIds(userIds);
            setProgress(progress);
        });
    }, unsubscribe => unsubscribe && unsubscribe(), [course?.id, metric, startAfterId, numRows]);
    useEffect(() => setCurrentUserIds(userIds), [userIds, setCurrentUserIds]);

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
    const navigate = useNavigate();
    const {course} = useContext(CourseContext);
    const [hasMore, setHasMore] = useState(true);
    const [maxLevel, setMaxLevel] = useState(0);
    const [levelOpen, setLevelOpen] = useState<{[key: string]: boolean}>({});
    const [levelExercises, setLevelExercises] = useState<{[key: string]: Exercise[]}>({});
    const [lastIds, setLastIds] = useState<(string | null)[]>([]);
    const rowsPerPage = 10; // Can't be more because of onLevelExerciseProgressChanged
                            // "Firestore 'in' filters support a maximum of 10 elements in the value array"

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
    const onExerciseClicked = useCallback((exerciseId: string) => navigate(`/${course?.id}/${exerciseId}`), [course?.id, navigate]);

    const onPageUserIdsChanged = useCallback((index: number, userIds: string[]) => {
        setLastIds(lastIds => {
            const hasMore = userIds.length === rowsPerPage;
            if( index >= lastIds.length - 2 ) {
                setHasMore(hasMore);
                // console.log('setting has more:', 'index:', index, 'lastIds.length:', lastIds.length, hasMore);
            }
            console.log('onPageUserIdsChanged:', index, userIds);
            const newVal = hasMore ? userIds.at(-1)! : null;
            if( lastIds[index] === newVal )
                return lastIds;
            const newUserIds = [...lastIds];
            newUserIds[index] = newVal;
            console.log('new last ids:', index, newUserIds);
            return newUserIds;
        })
    }, []);

    const loadNextPage = () => {
        console.log('load next page...', lastIds);
        if( lastIds.length > 0 && lastIds.at(-1) === null )
            return;
        setLastIds(lastIds => [...lastIds, null]);
    }

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
                                    <Typography variant="body2">{course?.levelScores?.[levelName] ?? '?'}</Typography>
                                </TableCell>}

                                {levelOpen[levelName] && levelName in levelExercises && levelExercises[levelName].map((ex, index) =>
                                    <ClickableTableCell key={ex.id} align="right" sx={{width: 50}} onClick={() => onExerciseClicked(ex.id)}>
                                        {index + 1}
                                    </ClickableTableCell>
                                )}
                            </>
                        })}
                    </TableRow>
                </TableHead>

                <TableBody>
                    {lastIds.map((pageId, index) => {
                        const startAfterId = index === 0 ? null : lastIds[index - 1];
                        if( !startAfterId && index !== 0 )
                            return <></>
                        return <>
                            <RankingPage
                                metric={metric} numRows={rowsPerPage} startAfterId={startAfterId} startIndex={index * rowsPerPage + 1}
                                showProgress={showProgress}
                                levelOpen={levelOpen} maxLevel={maxLevel} levelExercises={levelExercises}
                                setCurrentUserIds={(userIds) => onPageUserIdsChanged(index, userIds)} />
                        </>
                    })}
                </TableBody>
            </Table>
            <BottomLoading hasMore={hasMore} loadMore={loadNextPage} />
        </TableContainer>
    );
}

export default memo(RankingTable);

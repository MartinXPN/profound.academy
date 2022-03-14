import React, {memo, useCallback, useContext, useMemo, useState} from "react";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import {Exercise} from "models/exercise";
import {getCourseLevelExercises} from "../../services/exercises";
import {CourseContext} from "../Course";
import {Equalizer} from "@mui/icons-material";
import {Typography} from "@mui/material";
import useAsyncEffect from "use-async-effect";
import {useNavigate} from "react-router-dom";
import ClickableTableCell from "../../common/ClickableTableCell";
import {BottomLoading} from "../../common/loading";
import RankingPage from "./RankingPage";


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

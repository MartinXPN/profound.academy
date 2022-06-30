import {memo, useCallback, useContext, useMemo, useState} from "react";
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
import {Tooltip, Typography} from "@mui/material";
import useAsyncEffect from "use-async-effect";
import {useNavigate} from "react-router-dom";
import ClickableTableCell from "../../common/ClickableTableCell";
import InfiniteScrollLoading from "../../common/InfiniteScrollLoading";
import RankingPage from "./RankingPage";
import {LocalizeContext} from "../../common/Localization";


function RankingTable({metric, showProgress}: {metric: string, showProgress?: boolean}) {
    const navigate = useNavigate();
    const {course} = useContext(CourseContext);
    const {localize} = useContext(LocalizeContext);
    const [hasMore, setHasMore] = useState(true);
    const [levelOpen, setLevelOpen] = useState<{[key: string]: boolean}>({});
    const [levelExercises, setLevelExercises] = useState<{[key: string]: Exercise[]}>({});
    const [lastIds, setLastIds] = useState<(string | null)[]>([]);
    const rowsPerPage = 10; // Can't be more because of onLevelExerciseProgressChanged
                            // "Firestore 'in' filters support a maximum of 10 elements in the value array"

    // single-level rankings should always be open
    useMemo(() => {
        if( course && course.levels.length === 1 )
            setLevelOpen(lOpen => {return {...lOpen, [course.levels[0].id]: true}});
    }, [course]);

    // Exercises for open levels
    useAsyncEffect(async () => {
        if( !course )
            return;

        return await Promise.all(Object.entries(levelOpen).map(async ([level, isOpen]) => {
            if( !isOpen )
                return null;
            if( level in levelExercises )
                return levelExercises[level];

            const levelEx = await getCourseLevelExercises(course.id, level);
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
            const newVal = hasMore && userIds.length > 0 ? userIds[userIds.length - 1] : null;
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
        if( lastIds.length > 0 && lastIds[lastIds.length - 1] === null )
            return;
        setLastIds(lastIds => [...lastIds, null]);
    }

    if( !course )
        return <></>
    return (
        <TableContainer sx={{ maxHeight: 'calc(100vh - 64px)', width: '100%' }}>
            <Table stickyHeader>
                <TableHead>
                <TableRow>
                    <TableCell key="#" align="center" sx={{minWidth: 20}}>#</TableCell>
                    <TableCell key="userDisplayName" align="left" sx={{minWidth: 200}}>User</TableCell>
                    <TableCell key="total" align="right" sx={{width: 50}}>Total</TableCell>

                    {course.levels.map((level, index) => <>
                        {course.levels.length >= 2 &&
                            <Tooltip key={`tooltip-${level.id}`} disableInteractive placement="top-start" title={localize(level.title)}>
                            <ClickableTableCell key={level.id} align="right" onClick={() => onLevelClicked(level.id)} sx={{width: 50}}>
                                <Typography variant="subtitle1" sx={{verticalAlign: 'middle', display: 'inline-flex'}}>
                                    <Equalizer/> {index + 1}
                                </Typography>
                                <Typography variant="body2">{level.score}</Typography>
                            </ClickableTableCell>
                            </Tooltip>
                        }

                        {levelOpen[level.id] && level.id in levelExercises && levelExercises[level.id].map((ex, index) =>
                            <Tooltip key={`tooltip-${ex.id}`} disableInteractive title={localize(ex.title)}>
                                <ClickableTableCell key={ex.id} align="right" sx={{width: 50}} onClick={() => onExerciseClicked(ex.id)}>
                                    <Typography variant="subtitle1">{index + 1}</Typography>
                                </ClickableTableCell>
                            </Tooltip>
                        )}
                    </>)}
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
                                levelOpen={levelOpen} levelExercises={levelExercises}
                                setCurrentUserIds={(userIds) => onPageUserIdsChanged(index, userIds)} />
                        </>
                    })}
                </TableBody>
            </Table>
            <InfiniteScrollLoading hasMore={hasMore} loadMore={loadNextPage} />
        </TableContainer>
    );
}

export default memo(RankingTable);

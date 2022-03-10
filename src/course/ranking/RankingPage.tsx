import React, {memo, useCallback, useContext, useEffect, useState} from "react";
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import {Exercise, Progress} from "models/courses";
import {onLevelExerciseProgressChanged, onProgressChanged} from "../../services/progress";
import {CourseContext} from "../Course";
import {Stack} from "@mui/material";
import useAsyncEffect from "use-async-effect";
import {useNavigate} from "react-router-dom";
import ClickableTableCell from "../../common/ClickableTableCell";
import SmallAvatar from "../../common/SmallAvatar";
import {statusColors} from "../colors";
import UserSubmissionsBackdrop, {SubmissionsInfo} from "./UserSubmissionsBackdrop";


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
    const [displayedSubmissions, setDisplayedSubmissions] = useState<SubmissionsInfo | null>(null);

    const uppercaseMetric = metric.charAt(0).toUpperCase() + metric.slice(1);
    const levelMetric = 'level' + uppercaseMetric;
    const exerciseMetric = 'exercise' + uppercaseMetric;

    const onUserClicked = useCallback((userId: string) => navigate(`/users/${userId}`), [navigate]);
    const onUserExerciseClicked = useCallback((userId: string, userImageUrl: string | undefined, userDisplayName: string, exercise: Exercise) => {
        if( !course?.id )
            return;
        setDisplayedSubmissions({userId: userId, userImageUrl: userImageUrl, userDisplayName: userDisplayName, courseId: course.id, exercise: exercise});
    }, [course?.id]);
    const handleClose = useCallback(() => setDisplayedSubmissions(null), []);

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
        {displayedSubmissions && <UserSubmissionsBackdrop submissionsInfo={displayedSubmissions} handleClose={handleClose} />}

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
                    {showProgress ? '+' : ''}{metric in row ? Math.trunc(row[metric]): '-' }
                </TableCell>

                {(maxLevel >= 1) && Array(maxLevel).fill(1).map((_, index) => {
                    const levelName = (index + 1).toString();
                    // @ts-ignore
                    const levelScore = row?.[levelMetric]?.[levelName];
                    return <>
                        {maxLevel >= 2 &&
                            <TableCell key={levelName} align="right">
                                {levelScore ? Math.trunc(levelScore) : '-'}
                            </TableCell>}


                        {levelOpen[levelName] && levelName in levelExercises && levelExercises[levelName].map(ex => {
                            const exerciseScore = levelExerciseProgress?.[levelName]?.[row.id]?.[ex.id];
                            return <>
                                <ClickableTableCell key={ex.id} align="right" onClick={() => onUserExerciseClicked(row.id, row.userImageUrl, row.userDisplayName, ex)}>
                                    {exerciseScore ? Math.trunc(exerciseScore) : '-'}
                                </ClickableTableCell>
                            </>
                        })}
                    </>
                })}
            </TableRow>
        )}
    </>
}

export default memo(RankingPage);

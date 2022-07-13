import {useEffect, useState} from "react";
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import {Course} from "models/courses";
import {Exercise} from "models/exercise";
import {onCourseSubmissionsChanged, onSubmissionsChanged, onUserExerciseSubmissionsChanged, onUserSubmissionsChanged} from "../../services/submissions";
import {SubmissionResult} from "models/submissions";
import moment from "moment/moment";
import InfiniteScrollLoading from "../../common/InfiniteScrollLoading";
import SubmissionsPage from "./SubmissionsPage";


export interface Column {
    id: '#' | 'userDisplayName' | 'createdAt' | 'courseTitle' | 'exerciseTitle' | 'status' | 'time' | 'memory' | 'language';
    label: string;
    minWidth?: number;
    align?: 'right';
    format?: (value: any) => string;
}

const columns: Column[] = [
    { id: '#', label: '#', minWidth: 20 },
    { id: 'userDisplayName', label: 'User', minWidth: 100 },
    { id: 'courseTitle', label: 'Course', minWidth: 100 },
    { id: 'exerciseTitle', label: 'Exercise', minWidth: 100 },
    { id: 'status', label: 'Status', minWidth: 50 },
    { id: 'time', label: 'Time (s)', minWidth: 50, align: 'right', format: (value: number) => value ? value.toFixed(2) : '' },
    { id: 'memory', label: 'Memory (MB)', minWidth: 50, align: 'right', format: (value: number) => value ? value.toFixed(1): '' },
    { id: 'language', label: 'Language', minWidth: 50 },
    { id: 'createdAt', label: 'Date', minWidth: 100, format: (value) => moment(value.toDate()).locale('en').format('YYYY MMM Do, HH:mm:ss') },
];

function SubmissionsTable({reset, loadSubmissions, columns, rowsPerPage}: {
    reset: number,
    loadSubmissions: (startAfterId: string | null, onChange: (submissions: SubmissionResult[], more: boolean) => void) => Promise<() => void>
    columns: Column[],
    rowsPerPage: number,
}) {
    const [hasMore, setHasMore] = useState(true);
    const [lastId, setLastId] = useState<string | null>(null);
    const [startAfterIds, setStartAfterIds] = useState<(string | null)[]>([]);

    useEffect(() => {
        setHasMore(true);
        setLastId(null);
        setStartAfterIds([]);
    }, [reset]);

    const loadNextPage = () => {
        setStartAfterIds(startAfterIds => {
            if( startAfterIds.length > 0 && startAfterIds[startAfterIds.length - 1] === lastId )
                return startAfterIds;
            console.log('load next page...', startAfterIds);
            setHasMore(false);
            return [...startAfterIds, lastId];
        });
    }
    const onMoreLoaded = (pageId: number, lastId: string) => {
        console.log('onMoreLoaded:', pageId, lastId);
        if(pageId === startAfterIds.length - 1) {
            setLastId(lastId);
            setTimeout(() => setHasMore(true), 100);    // Avoid loading two times in a raw
        }
    }

    return <>
        <Paper sx={{width: '100%'}}>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => <>
                                <TableCell key={column.id} align={column.align} sx={{ minWidth: column.minWidth }}>
                                    {column.label}
                                </TableCell>
                            </>)}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {startAfterIds.map((startAfterId, pageId) => <>
                            <SubmissionsPage
                                startAfterId={startAfterId}
                                startIndex={pageId * rowsPerPage + 1}
                                columns={columns}
                                loadSubmissions={loadSubmissions}
                                onMoreLoaded={(lastId) => onMoreLoaded(pageId, lastId)} />
                        </>)}
                    </TableBody>
                </Table>
            </TableContainer>
            <InfiniteScrollLoading hasMore={hasMore} loadMore={loadNextPage} />
        </Paper>
    </>
}


export function UserSubmissionsTable({rowsPerPage, userId}: {rowsPerPage: number, userId: string}) {
    const loadSubmissions = async (startAfterId: string | null, onChange: (submissions: SubmissionResult[], more: boolean) => void) =>
        await onUserSubmissionsChanged(userId, startAfterId ?? null, rowsPerPage, onChange);

    const [reset, setReset] = useState(0);
    useEffect(() => setReset(r => r + 1), [userId]);
    return <SubmissionsTable reset={reset} loadSubmissions={loadSubmissions} columns={columns.filter(c => c.id !== 'userDisplayName')} rowsPerPage={rowsPerPage}/>
}

export function UserExerciseSubmissionsTable({rowsPerPage, userId, courseId, exerciseId}: {
    rowsPerPage: number, userId: string, courseId: string, exerciseId: string
}) {
    const loadSubmissions = async (startAfterId: string | null, onChange: (submissions: SubmissionResult[], more: boolean) => void) =>
        await onUserExerciseSubmissionsChanged(userId, courseId, exerciseId, 'desc', startAfterId ?? null, rowsPerPage, onChange);

    const [reset, setReset] = useState(0);
    useEffect(() => setReset(r => r + 1), [userId]);
    return <SubmissionsTable reset={reset} loadSubmissions={loadSubmissions} columns={columns.filter(c => c.id !== 'userDisplayName' && c.id !== 'courseTitle' && c.id !== 'exerciseTitle')} rowsPerPage={rowsPerPage}/>
}

export function UserDateSubmissionsTable({rowsPerPage, userId, startDate, endDate}: {rowsPerPage: number, userId: string, startDate: Date, endDate: Date}) {
    const loadSubmissions = async (startAfterId: string | null, onChange: (submissions: SubmissionResult[], more: boolean) => void) =>
        await onUserSubmissionsChanged(userId, startAfterId ?? null, rowsPerPage, onChange, startDate, endDate, 'asc');

    const [reset, setReset] = useState(0);
    useEffect(() => setReset(r => r + 1), [userId]);
    return <SubmissionsTable reset={reset} loadSubmissions={loadSubmissions} columns={columns.filter(c => c.id !== 'userDisplayName')} rowsPerPage={rowsPerPage}/>
}


export function CourseSubmissionsTable({rowsPerPage, course, userId, mode}: {rowsPerPage: number, course: Course, userId?: string, mode: 'all' | 'my'}) {
    const loadSubmissions = async (startAfterId: string | null, onChange: (submissions: SubmissionResult[], more: boolean) => void) =>
        await onCourseSubmissionsChanged(course.id, userId, mode, startAfterId ?? null, rowsPerPage, onChange);

    const [reset, setReset] = useState(0);
    useEffect(() => setReset(r => r + 1), [course.id, mode]);
    return <SubmissionsTable reset={reset} loadSubmissions={loadSubmissions} columns={columns.filter(c => c.id !== 'courseTitle')} rowsPerPage={rowsPerPage}/>
}

export function ExerciseSubmissionsTable({rowsPerPage, course, exercise, userId, mode}: {
    rowsPerPage: number, course: Course, exercise: Exercise, userId: string, mode: 'all' | 'best' | 'my'}
) {
    const loadSubmissions = async (startAfterId: string | null, onChange: (submissions: SubmissionResult[], more: boolean) => void) =>
        await onSubmissionsChanged(course.id, exercise.id, userId, mode, startAfterId ?? null, rowsPerPage, onChange);

    const [reset, setReset] = useState(0);
    useEffect(() => setReset(r => r + 1), [course.id, exercise.id, mode]);
    return <SubmissionsTable reset={reset} loadSubmissions={loadSubmissions} columns={columns.filter(c => c.id !== 'courseTitle' && c.id !== 'exerciseTitle')} rowsPerPage={rowsPerPage}/>
}

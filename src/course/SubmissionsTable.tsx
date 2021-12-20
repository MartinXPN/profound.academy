import React, {useCallback, useEffect, useRef} from "react";
import useState from 'react-usestateref';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import {Course, Exercise} from "../models/courses";
import {useOnScreen} from '../util';
import {onSubmissionsChanged} from "../services/submissions";
import {SubmissionResult} from "../models/submissions";
import moment from "moment/moment";
import SubmissionBackdrop from "./SubmissionBackdrop";
import {statusToColor} from "./colors";
import {useHistory} from "react-router-dom";

interface Column {
    id: '#' | 'userDisplayName' | 'createdAt' | 'status' | 'time' | 'memory' | 'language';
    label: string;
    minWidth?: number;
    align?: 'right';
    format?: (value: any) => string;
}

const columns: Column[] = [
    { id: '#', label: '#', minWidth: 20 },
    { id: 'userDisplayName', label: 'User', minWidth: 100 },
    { id: 'createdAt', label: 'Date', minWidth: 100, format: (value) => moment(value.toDate()).format('YYYY MMM Do, HH:mm:ss') },
    { id: 'status', label: 'Status', minWidth: 50 },
    { id: 'time', label: 'Time (s)', minWidth: 50, align: 'right', format: (value: number) => value ? value.toFixed(2) : '' },
    { id: 'memory', label: 'Memory (MB)', minWidth: 50, align: 'right', format: (value: number) => value ? value.toFixed(1): '' },
    { id: 'language', label: 'Language', minWidth: 50 },
];


function Bottom({hasMore, loadMore}: {hasMore: boolean, loadMore: () => void}) {
    const ref = useRef();
    const isVisible = useOnScreen(ref);

    if( hasMore && isVisible )
        loadMore();

    // @ts-ignore
    return <div ref={ref} style={{ paddingBottom: '5em' }}>{isVisible && hasMore &&
        <Box sx={{ textAlign: 'center', width: '100%', margin: '1em' }}>
            <CircularProgress />
        </Box>
    }
    </div>
}


function SubmissionsTable({course, exercise, mode}: {course: Course, exercise: Exercise, mode: 'all' | 'best'}) {
    const [page, setPage, pageRef] = useState(0);
    const [hasMore, setHasMore, moreRef] = useState(true);
    const rowsPerPage = 5;
    const [pageSubmissions, setPageSubmissions, pageSubmissionsRef] = useState<SubmissionResult[][]>([]);
    const [updateSubscriptions, setUpdateSubscriptions] = useState<(() => void)[]>([]);
    const [displayedSubmission, setDisplayedSubmission] = useState<SubmissionResult | undefined>(undefined);
    const history = useHistory();

    const onSubmissionClicked = async (submission: SubmissionResult) => {
        console.log('clicked!', submission);
        setDisplayedSubmission(submission);
    }
    const onCloseSubmission = () => setDisplayedSubmission(undefined);

    const onUserClicked = useCallback((userId: string) => {
        history.push(`/users/${userId}`);
    }, [history]);

    useEffect(() => {
        // unsubscribe from all the listeners
        return () => {
            console.log('Unsubscribing from table listeners!');
            for( const unsubscribe of updateSubscriptions )
                unsubscribe();
        }
    }, []);
    useEffect(() => {
        console.log('unsubscribing from the previous exercise');
        for( const unsubscribe of updateSubscriptions )
            unsubscribe();

        setPage(0);
        setHasMore(true);
        setPageSubmissions([]);
        setUpdateSubscriptions([]);
        setDisplayedSubmission(undefined);
    }, [exercise.id]);

    const loadNextPage = async () => {
        console.log('Load more!');
        const startAfterId = page === 0 || !pageSubmissionsRef.current[page - 1]
            ? null
            : pageSubmissionsRef.current[page - 1].at(-1)?.id;

        if( updateSubscriptions[page] ) {
            console.log('Not loading as we have an active listener!');
            return;
        }
        console.log('startAfter:', startAfterId, 'for page:', page);

        const unsubscribe = await onSubmissionsChanged(
            course.id, exercise.id, mode, startAfterId ?? null, rowsPerPage,
            ((submissions, more) => {
                console.log('setting the new submissions to page:', page, 'while total page is:', pageRef.current);
                setHasMore(more && moreRef.current);
                const currentSubscriptions = [...pageSubmissionsRef.current];
                currentSubscriptions[page] = submissions;
                setPageSubmissions(currentSubscriptions);
                setPage(Math.max(pageRef.current, page + 1));
            }));

        setUpdateSubscriptions([...updateSubscriptions, unsubscribe]);
    };

    console.log('SubmissionTable:', exercise);
    let orderNumber = 1;
    return (
        <Paper style={{width: '100%'}}>
            {displayedSubmission && <SubmissionBackdrop submission={displayedSubmission} onClose={onCloseSubmission} />}
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                            <TableCell
                                key={column.id}
                                align={column.align}
                                style={{ minWidth: column.minWidth }}>
                                {column.label}
                            </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pageSubmissions.map((submissions, page) => submissions.map((row, index) =>
                        <TableRow hover role="checkbox" tabIndex={-1} key={row.id} onClick={() => onSubmissionClicked(row)}>
                            {columns.map((column) => {
                                if( column.id === '#' )
                                    return <TableCell key={column.id} align={column.align}>{orderNumber++}</TableCell>;

                                const value = row[column.id];
                                if( column.id === 'userDisplayName' )
                                    return <TableCell key={column.id} align={column.align} sx={{"&:focus,&:hover": {cursor: 'pointer'}}} onClick={() => onUserClicked(row.userId)}>{value}</TableCell>

                                // @ts-ignore
                                const style = column.id === 'status' ? {color: statusToColor(value)} : {};
                                return (
                                    <TableCell key={column.id} align={column.align} style={style}>
                                        {column.format ? column.format(value) : value}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Bottom hasMore={hasMore} loadMore={loadNextPage} />
        </Paper>
    );
}

export default SubmissionsTable;

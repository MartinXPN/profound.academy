import React, {useState} from "react";
import makeStyles from '@mui/styles/makeStyles';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';

import {Course, Exercise} from "../models/courses";
import useAsyncEffect from "use-async-effect";
import {getBestSubmissions, getSubmissions} from "../services/submissions";
import {SubmissionResult} from "../models/submissions";
import moment from "moment/moment";
import SubmissionBackdrop from "./SubmissionBackdrop";
import {statusToColor} from "./colors";

const useStyles = makeStyles({
    root: {
        width: '100%',
    },
});

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


interface SubmissionsTableProps {
    course: Course;
    exercise: Exercise;
    mode: 'all' | 'best';
}

function SubmissionsTable(props: SubmissionsTableProps) {
    const classes = useStyles();
    const {course, exercise, mode} = props;
    const [page, setPage] = useState(0);
    const handleChangePage = (event: unknown, newPage: number) => setPage(newPage);
    const rowsPerPage = 20;
    const [submissions, setSubmissions] = useState<SubmissionResult[]>([]);
    const [displayedSubmission, setDisplayedSubmission] = useState<SubmissionResult | undefined>(undefined);

    const onSubmissionClicked = async (submission: SubmissionResult) => {
        console.log('clicked!', submission);
        setDisplayedSubmission(submission);
    }
    const onCloseSubmission = () => setDisplayedSubmission(undefined);

    console.log('locale:', moment.locale());
    useAsyncEffect(async () => {
        const submissions = mode === 'best' ?
            await getBestSubmissions(course.id, exercise.id) :
            await getSubmissions(course.id, exercise.id);
        setSubmissions(submissions);
    }, [course, exercise])

    console.log('SubmissionTable:', exercise);

    return (
        <Paper className={classes.root}>
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
                        {submissions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) =>
                            <TableRow hover role="checkbox" tabIndex={-1} key={row.id} onClick={() => onSubmissionClicked(row)}>
                                {columns.map((column) => {
                                    if( column.id === '#' )
                                        return (
                                            <TableCell key={column.id} align={column.align}>
                                                {page * rowsPerPage + index + 1}
                                                {/*<Button style={{margin: 0, padding: 0}} size="small" variant="text"></Button>*/}
                                            </TableCell>
                                        );

                                    const value = row[column.id];
                                    // @ts-ignore
                                    const style = column.id === 'status' ? {color: statusToColor(value)} : {};
                                    return (
                                        <TableCell key={column.id} align={column.align} style={style}>
                                            {column.format ? column.format(value) : value}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[rowsPerPage]}
                component="div"
                count={submissions.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage} />
        </Paper>
    );
}

export default SubmissionsTable;

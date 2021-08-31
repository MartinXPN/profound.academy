import React, {useState} from "react";
import {makeStyles} from "@material-ui/core";
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';

import {Course, Exercise} from "../models/courses";
import useAsyncEffect from "use-async-effect";
import {getBestSubmissions, getSubmissions} from "../services/submissions";
import {SubmissionResult} from "../models/submissions";
import moment from "moment/moment";

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
    { id: '#', label: '#', minWidth: 25 },
    { id: 'userDisplayName', label: 'User', minWidth: 100 },
    { id: 'createdAt', label: 'Date', minWidth: 100, format: (value) => moment(value.toDate()).format('YYYY MMMM Do, hh:mm:ss') },
    { id: 'status', label: 'Status', minWidth: 75 },
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
    const rowsPerPage = 10;
    const [submissions, setSubmissions] = useState<SubmissionResult[]>([]);

    console.log(moment.locale());

    useAsyncEffect(async () => {
        if( mode === 'all' ) {
            const submissions = await getSubmissions(course.id, exercise.id);
            setSubmissions(submissions);
        }
        else if( mode === 'best' ) {
            const submissions = await getBestSubmissions(exercise.id);
            setSubmissions(submissions);
        }
    }, [course, exercise])

    console.log('SubmissionTable:', exercise);

    return (
        <Paper className={classes.root}>
            <TableContainer>
                <Table stickyHeader aria-label="sticky table">
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
                        {submissions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => {
                            return (
                                <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                                    {columns.map((column) => {
                                        if( column.id === '#' )
                                            return (
                                                <TableCell key={column.id} align={column.align}>
                                                    {page * rowsPerPage + index + 1}
                                                </TableCell>
                                            );

                                        const value = row[column.id];
                                        return (
                                            <TableCell key={column.id} align={column.align}>
                                                {column.format ? column.format(value) : value}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
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

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

import {Course, UserRank} from "../models/courses";
import useAsyncEffect from "use-async-effect";
import {getRanking} from "../services/courses";

const useStyles = makeStyles({
    root: {
        width: '100%',
    },
});

interface Column {
    id: '#' | 'userDisplayName' | 'totalScore';
    label: string;
    minWidth?: number;
    align?: 'right';
    format?: (value: any) => string;
}

const columns: Column[] = [
    { id: '#', label: '#', minWidth: 20 },
    { id: 'userDisplayName', label: 'User', minWidth: 100 },
    { id: 'totalScore', label: 'Total Score', minWidth: 50, align: 'right', format: (value: number) => value ? value.toFixed(0): '-' },
];


function RankingTable({course}: {course: Course}) {
    const classes = useStyles();
    const [page, setPage] = useState(0);
    const handleChangePage = (event: unknown, newPage: number) => setPage(newPage);
    const rowsPerPage = 20;
    const [ranks, setRanks] = useState<UserRank[]>([]);
    const [exerciseIds, setExerciseIds] = useState<string[]>([]);

    useAsyncEffect(async () => {
        const ranks: UserRank[] = await getRanking(course.id);
        setRanks(ranks);

        // TODO: get ordered exercises
        const exerciseIds = ranks.map(r => Object.keys(r.scores)).flat();
        setExerciseIds([...new Set(exerciseIds)]);
    }, [course])


    return (
        <Paper className={classes.root}>
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
                            {exerciseIds.map((id, index) =>
                                <TableCell key={id} align="right" style={{minWidth: 50}}>
                                    {index + 1}
                                </TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {ranks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) =>
                            <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                                {columns.map((column) => {
                                    if( column.id === '#' )
                                        return (
                                            <TableCell key={column.id} align={column.align}>
                                                {page * rowsPerPage + index + 1}
                                            </TableCell>
                                        );

                                    // @ts-ignore
                                    const value = row[column.id];
                                    return (
                                        <TableCell key={column.id} align={column.align}>
                                            {column.format ? column.format(value) : value}
                                        </TableCell>
                                    );
                                })}
                                {exerciseIds.map((id, index) =>
                                    <TableCell key={id} align="right">
                                        {id in row.scores ? row.scores[id].toFixed(0) : '-'}
                                    </TableCell>
                                )}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[rowsPerPage]}
                component="div"
                count={ranks.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage} />
        </Paper>
    );
}

export default RankingTable;

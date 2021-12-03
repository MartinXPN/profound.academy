import React, {useContext, useEffect, useState} from "react";
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import {Progress} from "../models/courses";
import {onProgressChanged} from "../services/courses";
import {CourseContext} from "./Course";
import {Equalizer} from "@mui/icons-material";
import {Typography} from "@mui/material";
import {makeStyles} from "@mui/styles";


const useStyles = makeStyles({
    wrapIcon: {
        verticalAlign: 'middle',
        display: 'inline-flex'
    }
});

function RankingTable({exerciseIds, metric}: {exerciseIds: string[], metric: 'score' | 'solved' | 'upsolveScore'}) {
    const classes = useStyles();
    const {course} = useContext(CourseContext);
    const [page, setPage] = useState(0);
    const rowsPerPage = 20;
    const [progress, setProgress] = useState<Progress[]>([]);
    const [maxLevel, setMaxLevel] = useState(0);

    const levelMetric = 'level' + metric.charAt(0).toUpperCase() + metric.slice(1);

    useEffect(() => {
        if( !course )
            return;
        return onProgressChanged(course.id, metric, progress => {
            setProgress(progress);
            // @ts-ignore
            const maxLevel = progress.map(p => levelMetric in p ? p[levelMetric] as number : {"1": 0})
                .map(scores => scores ? Object.keys(scores)
                    .map(level => parseInt(level))
                    .reduce((prev, cur) => Math.max(prev, cur)) : 0)
                .reduce((prev, cur) => Math.max(prev, cur));

            setMaxLevel(maxLevel);
        });
    }, [course, metric, levelMetric])


    return (
        <Paper sx={{width: '100%'}}>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell key="#" align="center" style={{minWidth: 20}}>#</TableCell>
                            <TableCell key="userDisplayName" align="left" style={{minWidth: 100}}>User</TableCell>
                            <TableCell key="total" align="right" style={{minWidth: 50}}>Total</TableCell>

                            {maxLevel >= 2 && Array(maxLevel).fill(1).map((_, level) => {
                                return <TableCell key={level} align="right" style={{minWidth: 50}}>
                                    <Typography variant="subtitle1" className={classes.wrapIcon}>
                                        <Equalizer /> {level}
                                    </Typography>
                                </TableCell>
                            })}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {progress.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) =>
                            <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                                <TableCell key="#" align="center">{page * rowsPerPage + index + 1}</TableCell>
                                <TableCell key="userDisplayName" align="left">{row.userDisplayName}</TableCell>
                                { /* @ts-ignore */ }
                                <TableCell key="total" align="right">{metric in row ? row[metric].toFixed(0): '-' }</TableCell>

                                {maxLevel >= 2 && Array(maxLevel).fill(1).map((_, level) => {
                                    const levelName = (level + 1).toString();
                                    return <TableCell key={levelName} align="right">
                                        { /* @ts-ignore */ }
                                        {levelMetric in row && levelName in row[levelMetric] ? row[levelMetric][levelName].toFixed(0) : '-'}
                                    </TableCell>
                                })}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}

export default RankingTable;

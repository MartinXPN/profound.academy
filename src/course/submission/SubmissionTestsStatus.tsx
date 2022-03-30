import {memo, useEffect, useState} from "react";
import {TestResult} from "models/lib/submissions";
import {SubmissionResult} from "models/submissions";
import {onSubmissionTestResultsChanged} from "../../services/submissions";
import {TableCell, Typography, Table, TableContainer, TableRow, TableBody, Paper, TableHead} from "@mui/material";
import {statusToColor} from "../colors";


function SubmissionTestsStatus({submission}: {submission: SubmissionResult}) {
    const [testResults, setTestResults] = useState<TestResult[] | null>(null);

    useEffect(() => {
        return onSubmissionTestResultsChanged(submission.userId, submission.id, setTestResults);
    }, [submission]);

    if( !testResults )
        return <></>
    return <>
        <Typography align="center">Results for all {testResults.length} tests</Typography>
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell>#ID</TableCell>
                        <TableCell align="center">Score</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Time&nbsp;(s)</TableCell>
                        <TableCell align="center">Memory&nbsp;(MB)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {testResults.map((test, index) => {
                        const color = statusToColor(test.status);
                        return <>
                            <TableRow key={`${submission.id}-test-${index}`} sx={{'&:last-child td, &:last-child th': { border: 0 }}}>
                                <TableCell align="left">{index + 1}</TableCell>
                                <TableCell align="center">{parseFloat(test.score.toFixed(2))}</TableCell>
                                <TableCell align="center" style={{color: color}}>{test.status}</TableCell>
                                <TableCell align="center">{test.time.toFixed(2)}</TableCell>
                                <TableCell align="center">{test.memory.toFixed(1)}</TableCell>
                            </TableRow>
                        </>
                    })}
                </TableBody>
            </Table>
        </TableContainer>

    </>
}

export default memo(SubmissionTestsStatus);

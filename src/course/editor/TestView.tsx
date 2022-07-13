import {memo, useEffect, useState} from "react";
import {TestCase} from "models/exercise";
import {TextField, Typography} from "@mui/material";
import {statusToColor} from "../colors";
import {StatusTypography} from "../../common/StatusTypography";
import {TestResult} from "models/submissions";


function TestView({testCase, testName, testResult, readOnly, onSaveTest}: {
    testCase: TestCase,
    testName: string,
    testResult?: TestResult,
    readOnly: boolean,
    onSaveTest: (input: string, target: string) => void
}) {
    const [input, setInput] = useState('');
    const [target, setTarget] = useState('');

    useEffect(() => {
        setInput(testCase.input);
        setTarget(testCase.target);
    }, [testCase]);

    useEffect(() => {
        if( input === testCase.input && target === testCase.target )
            return;

        const timeOutId = setTimeout(() => onSaveTest(input, target), 200);
        return () => {
            console.log('cleared the timeout');
            clearTimeout(timeOutId);
        }
    }, [testCase, input, target, onSaveTest]);

    return <>
        {!!testResult?.status && !!testResult?.time && testResult?.score !== undefined && <>
        <StatusTypography style={{color: statusToColor(testResult?.status)}}>
            {testName}: {testResult.status} with score {parseFloat(testResult.score.toFixed(2))} in {testResult.time.toFixed(2)} seconds, used {testResult.memory?.toFixed(1)}MB
        </StatusTypography>
        </>}

        {testResult?.message && <Typography whiteSpace="pre-wrap" marginBottom={4}>{testResult.message}</Typography>}
        <TextField multiline fullWidth
                   variant="outlined"
                   label="Input"
                   placeholder="Start typing the input..."
                   onChange={event => setInput(event.target.value)}
                   value={input}
                   inputProps={{ readOnly: readOnly, style: {fontFamily: 'Monospace'} }}/>

        <br/><br/>
        <TextField multiline fullWidth
                   variant="outlined"
                   label="Expected output"
                   placeholder="Start typing the expected output..."
                   onChange={event => setTarget(event.target.value)}
                   value={target}
                   inputProps={{ readOnly: readOnly, style: {fontFamily: 'Monospace'} }}/>

        <br/><br/>
        {testResult?.outputs &&
        <TextField multiline fullWidth
                   variant="outlined"
                   label="Program output"
                   value={testResult.outputs}
                   inputProps={{ readOnly: true, style: {fontFamily: 'Monospace'} }}/>
        }
        <br/><br/>
        {testResult?.errors &&
        <TextField multiline fullWidth
                   variant="outlined"
                   label="Program errors (stderr)"
                   value={testResult.errors}
                   inputProps={{ readOnly: true, style: {fontFamily: 'Monospace'} }}/>
        }
    </>
}

export default memo(TestView);

import {TestCase} from "../../models/courses";
import { TextField, Typography } from "@mui/material";
import React, {memo, useEffect, useState} from "react";
import {statusToColor} from "../colors";
import {styled} from "@mui/material/styles";


const StatusTypography = styled(Typography)({
    fontWeight: 'bold',
    paddingTop: '8px',
    paddingBottom: '8px',
});


function TestView({testCase, output, readOnly, status, memory, time, onSaveTest}: {
    testCase: TestCase,
    output?: string,
    readOnly: boolean,
    status?: string,
    memory?: number,
    time?: number,
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
        {status && time &&
        <StatusTypography style={{color: statusToColor(status)}}>
            {status} in {time.toFixed(2)} seconds, used {memory?.toFixed(1)}MB
        </StatusTypography>
        }
        <TextField multiline fullWidth
                   variant="outlined"
                   label="Input"
                   placeholder="Start typing the input..."
                   onChange={event => setInput(event.target.value)}
                   value={input}
                   inputProps={{ readOnly: readOnly }}/>

        <br/><br/>
        <TextField multiline fullWidth
                   variant="outlined"
                   label="Expected output"
                   placeholder="Start typing the expected output..."
                   onChange={event => setTarget(event.target.value)}
                   value={target}
                   inputProps={{ readOnly: readOnly }}/>

        <br/><br/>
        {output &&
        <TextField multiline fullWidth
                   variant="outlined"
                   label="Program output"
                   value={output}
                   inputProps={{ readOnly: true }}/>
        }
    </>
}

export default memo(TestView);

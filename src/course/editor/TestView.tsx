import {TestCase} from "../../models/courses";
import { TextField, Typography } from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import React, {useEffect, useState} from "react";
import {statusToColor} from "../colors";

const useStyles = makeStyles({
    save: {
        marginBottom: '2em',
    },
    status: {
        fontWeight: 'bold',
        paddingTop: '8px',
        paddingBottom: '8px',
    },
});


function TestView({testCase, output, status, memory, time, onSaveTest}:
                  { testCase: TestCase, output?: string, status?: string, memory?: number, time?: number, onSaveTest: (input: string, target: string) => void }) {
    const classes = useStyles();

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
        <Typography className={classes.status} style={{color: statusToColor(status)}}>
            {status} in {time.toFixed(2)} seconds, used {memory?.toFixed(1)}MB
        </Typography>
        }
        <TextField multiline fullWidth
                   variant="outlined"
                   label="Input"
                   placeholder="Start typing the input..."
                   onChange={event => setInput(event.target.value)}
                   value={input} />

        <br/><br/>
        <TextField multiline fullWidth
                   variant="outlined"
                   label="Expected output"
                   placeholder="Start typing the expected output..."
                   onChange={event => setTarget(event.target.value)}
                   value={target} />

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

export default TestView;

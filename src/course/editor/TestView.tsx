import {TestCase} from "../../models/courses";
import { Button, TextField, Typography } from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import React, {useEffect, useState} from "react";
import SaveIcon from '@mui/icons-material/Save';
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


interface Props {
    testCase: TestCase;
    output?: string;
    status?: string;
    memory?: number;
    time?: number;
    onSaveTest: (input: string, target: string) => void;
}

function TestView(props: Props) {
    const classes = useStyles();
    const {testCase, output, status, memory, time, onSaveTest} = props;

    const [input, setInput] = useState('');
    const [target, setTarget] = useState('');
    const onSaveClicked = () => onSaveTest(input, target);

    useEffect(() => {
        setInput(testCase.input);
        setTarget(testCase.target);
    }, [testCase]);

    return (
        <>
            {status && time &&
            <Typography className={classes.status} style={{color: statusToColor(status)}}>
                {status} in {time.toFixed(2)} seconds, used {memory?.toFixed(1)}MB
            </Typography>
            }
            <TextField required multiline fullWidth
                       variant="outlined"
                       label="Input"
                       placeholder="Start typing the input..."
                       onChange={event => setInput(event.target.value)}
                       value={input} />

            <br/><br/>
            <TextField required multiline fullWidth
                       variant="outlined"
                       label="Expected output"
                       placeholder="Start typing the expected output..."
                       onChange={event => setTarget(event.target.value)}
                       value={target} />

            {(input !== testCase.input || target !== testCase.target) &&
            <Button
                className={classes.save}
                variant="contained"
                color="primary"
                size="small"
                startIcon={<SaveIcon />}
                onClick={onSaveClicked}>Save</Button>
            }
            <br/><br/>
            {output && <>
                <TextField multiline fullWidth
                           variant="outlined"
                           label="Program output"
                           defaultValue={target}
                           onChange={event => setTarget(event.target.value)}
                           inputProps={{ readOnly: true }}/>
            </>}
        </>
    );
}

export default TestView;

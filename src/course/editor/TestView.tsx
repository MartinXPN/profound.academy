import {TestCase} from "../../models/courses";
import {Button, makeStyles, TextField, Typography} from "@material-ui/core";
import {useEffect, useState} from "react";
import SaveIcon from '@material-ui/icons/Save';

const useStyles = makeStyles({
    bold: {
        fontWeight: 'bold',
    },
    save: {
        marginBottom: '2em',
    },
    content: {
        whiteSpace: 'pre',
    },
});


interface Props {
    testCase: TestCase;
    output?: string;
    onSaveTest: (input: string, target: string) => void;
}

function TestView(props: Props) {
    const classes = useStyles();
    const {testCase, output, onSaveTest} = props;

    const [input, setInput] = useState('');
    const [target, setTarget] = useState('');
    const onSaveClicked = () => onSaveTest(input, target);

    useEffect(() => {
        setInput(testCase.input);
        setTarget(testCase.target);
    }, [testCase]);

    return (
        <>
            <Typography className={classes.bold}>Input:</Typography>
            <TextField required multiline fullWidth
                       placeholder="Start typing the input..."
                       onChange={event => setInput(event.target.value)}
                       value={input}
                       InputProps={{ disableUnderline: true }} />

            <br/>
            <Typography className={classes.bold}>Expected output:</Typography>
            <TextField required multiline fullWidth
                       placeholder="Start typing the expected output..."
                       onChange={event => setTarget(event.target.value)}
                       value={target}
                       InputProps={{ disableUnderline: true }} />

            {(input !== testCase.input || target !== testCase.target) &&
            <Button
                className={classes.save}
                variant="contained"
                color="primary"
                size="small"
                startIcon={<SaveIcon />}
                onClick={onSaveClicked}>Save</Button>
            }
            <br/>
            {output && <>
                <Typography className={classes.bold}>Program output:</Typography>
                <Typography className={classes.content}>{output}</Typography>
            </>}
        </>
    );
}

export default TestView;

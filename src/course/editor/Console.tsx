import React, {useState} from "react";
import {Add, Done, Send} from "@material-ui/icons";
import {Button, CircularProgress, createStyles, IconButton, makeStyles, Theme, Typography} from "@material-ui/core";
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

import {Exercise} from "../../models/courses";
import {SubmissionResult} from "../../models/submissions";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '100%',
            overflow: 'hidden',
        },
        testText: {
            float: 'left',
            marginTop: '8px',
            marginRight: '8px',
        },
        tests: {
            float: 'left',
            paddingLeft: '24px',
            paddingRight: '24px',
        },
        addTest: {
            float: 'left',
            padding: '8px',
        },
        button: {
            margin: theme.spacing(1),
            float: 'right',
        },
        content: {
            whiteSpace: 'pre',
        },
        center: {
            width: '80%',
            margin: '10%',
            textAlign: 'center',
        },
    }),
);

interface Props {
    exercise: Exercise;
    onSubmitClicked: () => void;
    onRunClicked: () => void;
    isProcessing: boolean;
    submissionResult: SubmissionResult | undefined;
}


function Console(props: Props) {
    const classes = useStyles();
    const {exercise, onSubmitClicked, onRunClicked, isProcessing, submissionResult} = props;
    const [selectedTest, setSelectedTest] = useState<number | null>(null);

    const onTestSelected = (event: React.MouseEvent<HTMLElement>, newTest: number | null) => {
        setSelectedTest(newTest);
    }

    return (
        <>
            <div className={classes.root}>
                <Typography className={classes.testText}>TESTS: </Typography>
                <ToggleButtonGroup
                    value={selectedTest}
                    exclusive
                    onChange={onTestSelected}
                    size='small'
                    aria-label="text alignment"
                    style={{float: 'left'}}>

                    {exercise.testCases.map((test, index) =>
                        <ToggleButton value={index} id={`${index}`} className={classes.tests}>
                            <Typography>{index + 1}</Typography>
                        </ToggleButton>
                    )}
                </ToggleButtonGroup>
                <IconButton id="add-test" className={classes.addTest}><Add /></IconButton>

                <Button
                    variant="contained"
                    color="primary"
                    size='small'
                    className={classes.button}
                    onClick={onSubmitClicked}
                    endIcon={<Done />}>Submit</Button>

                <Button
                    variant="contained"
                    color="primary"
                    size='small'
                    className={classes.button}
                    onClick={onRunClicked}
                    endIcon={<Send />}>Run</Button>
            </div>


            {isProcessing &&
            <div className={classes.center}>
                <Typography>Running the program...</Typography>
                <CircularProgress />
            </div>}

            {submissionResult &&
            <>
                <Typography>{submissionResult.status} in {submissionResult.time} seconds</Typography>
                {/*<Typography>{submissionResult.compileOutputs ?? ''}</Typography>*/}
                <Typography className={classes.content}>{submissionResult.outputs ?? ''}</Typography>
            </>}

            {!isProcessing && !submissionResult &&
            <Typography>Run the program to see the output, Submit to evaluate</Typography>}

        </>
    )
}

export default Console;

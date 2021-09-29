import React, {useEffect, useState} from "react";
import {Add, Done, Send} from "@material-ui/icons";
import {Button, CircularProgress, createStyles, IconButton, makeStyles, Theme, Typography} from "@material-ui/core";
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

import {Exercise, TestCase} from "../../models/courses";
import {SubmissionResult} from "../../models/submissions";
import TestView from "./TestView";
import {statusColors, statusToColor} from "../colors";

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
        status: {
            fontWeight: 'bold',
            paddingTop: '8px',
            paddingBottom: '8px',
        },
        center: {
            width: '100%',
            marginTop: '5%',
            marginBottom: '5%',
            textAlign: 'center',
        },
    }),
);

interface Props {
    exercise: Exercise;
    onSubmitClicked: () => void;
    onRunClicked: (tests: TestCase[]) => void;
    isProcessing: boolean;
    submissionResult: SubmissionResult | undefined;
}


function Console(props: Props) {
    const classes = useStyles();
    const {exercise, onSubmitClicked, onRunClicked, isProcessing, submissionResult} = props;

    const outputs = submissionResult && submissionResult.outputs ? submissionResult.outputs : [];
    const status = submissionResult && submissionResult.status ? submissionResult.status : undefined;
    const memory = submissionResult && submissionResult.memory ? submissionResult.memory : undefined;
    const time = submissionResult && submissionResult.time ? submissionResult.time : undefined;
    const [selectedTest, setSelectedTest] = useState<number | null>(null);
    const [tests, setTests] = useState<TestCase[]>([]);

    useEffect(() => {
        setTests(exercise.testCases);
    }, [exercise]);
    if(selectedTest && selectedTest >= tests.length )
        setSelectedTest(null);

    useEffect(() => {
        if (selectedTest === null && submissionResult)
            setSelectedTest(0);
        // the dependency array does not include selectedTest on purpose
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submissionResult]);

    const handleRun = () => onRunClicked(tests);

    const onTestSelected = (event: React.MouseEvent<HTMLElement>, newTest: number | null) => setSelectedTest(newTest);
    const onSaveTest = (index: number, input: string, target: string) => {
        let newTests = [...tests];
        newTests[index] = {
            input: input,
            target: target,
        };
        setTests(newTests);
    };
    const addTest = () => {
        const len = tests.length;
        setTests([...tests, {
            input: '',
            target: '',
        }]);
        setSelectedTest(len);
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

                    {tests.map((test, index) => {
                        const currentStatus = Array.isArray(status) ? status[index] : status;
                        console.log('index:', index, 'status:', currentStatus);
                        return (
                            <ToggleButton value={index} id={`${index}`} key={index.toString()}
                                          className={classes.tests}
                                          style={{color: statusToColor(currentStatus, false)}}>
                                <Typography>{index + 1}</Typography>
                            </ToggleButton>
                        )}
                    )}
                </ToggleButtonGroup>
                <IconButton id="add-test" className={classes.addTest} onClick={addTest}><Add /></IconButton>

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
                    onClick={handleRun}
                    endIcon={<Send />}>Run</Button>
            </div>


            {isProcessing &&
            <div className={classes.center}>
                <Typography className={classes.status}>Running the program...</Typography>
                <CircularProgress />
            </div>}

            {submissionResult && submissionResult.compileOutputs &&
            <>
                <Typography className={classes.status} style={{color: statusColors.failed}}>{submissionResult.status}</Typography>
                <Typography className={classes.content}>{submissionResult.compileOutputs}</Typography>
            </>}

            {!isProcessing && !submissionResult && selectedTest === null &&
            <Typography className={classes.status}>Run the program to see the output, Submit to evaluate</Typography>}

            {selectedTest !== null && selectedTest < tests.length &&
            <TestView
                testCase={tests[selectedTest]}
                output={outputs[selectedTest]}
                status={Array.isArray(status) ? status[selectedTest] : status}
                memory={Array.isArray(memory) ? memory[selectedTest] : memory}
                time={Array.isArray(time) ? time[selectedTest] : time}
                onSaveTest={(input, target) => onSaveTest(selectedTest, input, target)} />}
        </>
    )
}

export default Console;

import React, {useEffect, useState} from "react";
import {Add, Done, Send} from "@mui/icons-material";
import {Badge, Button, CircularProgress, IconButton, Theme, Typography} from "@mui/material";
import HighlightOffTwoToneIcon from '@mui/icons-material/HighlightOffTwoTone';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import {Exercise, TestCase} from "../../models/courses";
import {SubmissionResult} from "../../models/submissions";
import TestView from "./TestView";
import {statusColors, statusToColor} from "../colors";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '100%',
            overflow: 'hidden',
            padding: '10px',
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
            padding: '12px',
        },
        button: {
            margin: theme.spacing(1),
            float: 'right',
        },
        content: {
            whiteSpace: 'pre-wrap',
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
    submissionResult: SubmissionResult | null;
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

    const onTestSelected = (newTest: number | null) => {
        if( newTest === selectedTest )
            setSelectedTest(null);
        else
            setSelectedTest(newTest);
    }
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
    const removeTest = (index: number) => {
        const newTests = [...tests];
        if( 0 <= index && index < newTests.length )
            newTests.splice(index, 1);
        setTests(newTests);
    }

    return <>
        <div className={classes.root}>
            <Typography className={classes.testText}>TESTS: </Typography>
            <ToggleButtonGroup value={selectedTest} exclusive size='small' style={{float: 'left'}}>

                {tests.map((test, index) => {
                    const currentStatus = Array.isArray(status) ? status[index] : status;
                    console.log('index:', index, 'status:', currentStatus);
                    return (<div key={index.toString()}>
                        <Badge badgeContent={selectedTest === index
                            ? <HighlightOffTwoToneIcon sx={{ color: '#515151', "&:focus,&:hover": {cursor: 'pointer'}}}
                                                       fontSize="small"
                                                       onClick={() => removeTest(index)}/>
                            : 0}>
                        <ToggleButton value={index} id={`${index}`}
                                      onClick={() => onTestSelected(index)}
                                      className={classes.tests}
                                      style={{color: statusToColor(currentStatus, false)}}>
                            <Typography>{index + 1}</Typography>
                        </ToggleButton>
                        </Badge>
                    </div>)}
                )}
            </ToggleButtonGroup>
            <IconButton id="add-test" className={classes.addTest} onClick={addTest} size="large"><Add /></IconButton>

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

        <div style={{padding: '10px'}}>
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
        </div>
    </>;
}

export default Console;

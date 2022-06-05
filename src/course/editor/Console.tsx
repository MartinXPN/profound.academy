import React, {memo, useCallback, useContext, useEffect, useState} from "react";
import {Add, Done, Send} from "@mui/icons-material";
import {Badge, Button, CircularProgress, IconButton, Typography} from "@mui/material";
import HighlightOffTwoToneIcon from '@mui/icons-material/HighlightOffTwoTone';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import {TestCase} from "models/exercise";
import {SubmissionResult} from "models/submissions";
import TestView from "./TestView";
import {statusColors, statusToColor} from "../colors";
import {CurrentExerciseContext} from "../Course";
import Box from "@mui/material/Box";
import {styled} from "@mui/material/styles";
import {TestResult} from "models/lib/submissions";


const StatusTypography = styled(Typography)({
    fontWeight: 'bold',
    paddingTop: '8px',
    paddingBottom: '8px',
});


function Console({onSubmitClicked, onRunClicked, isProcessing, submissionResult, testResults}: {
    onSubmitClicked: () => void, onRunClicked: (tests: TestCase[]) => void,
    isProcessing: boolean, submissionResult: SubmissionResult | null, testResults: TestResult[] | null,
}) {
    const {exercise} = useContext(CurrentExerciseContext);
    const [selectedTest, setSelectedTest] = useState<number | null>(null);
    const [tests, setTests] = useState<TestCase[]>([]);

    const getTestProp = (propName: 'message' | 'outputs' | 'errors' | 'status' | 'memory' | 'time' | 'score', index: number | null) => {
        if( index === null )
            return null;
        if( Array.isArray(submissionResult?.[propName]) ) {
            // @ts-ignore
            return submissionResult?.[propName]?.[index];
        }
        if( !testResults || testResults.length <= index )
            return submissionResult?.[propName];
        return testResults[index][propName];
    }

    useEffect(() => {
        if( exercise )
            setTests(exercise.testCases);
    }, [exercise]);
    if(selectedTest && selectedTest >= tests.length )
        setSelectedTest(null);

    useEffect(() => {
        if (selectedTest === null && submissionResult && submissionResult.status !== 'Checking')
            setSelectedTest(0);
        // the dependency array does not include selectedTest on purpose
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submissionResult]);

    const handleRun = () => onRunClicked(tests);

    const onTestSelected = useCallback((newTest: number | null) => setSelectedTest(newTest === selectedTest ? null : newTest), [selectedTest]);
    const onSaveTest = useCallback((index: number, input: string, target: string) => {
        let newTests = [...tests];
        newTests[index] = {
            input: input,
            target: target,
        };
        setTests(newTests);
    }, [tests]);
    const addTest = useCallback(() => {
        const len = tests.length;
        setTests([...tests, {
            input: '',
            target: '',
        }]);
        setSelectedTest(len);
    }, [tests]);
    const removeTest = useCallback((index: number) => {
        const newTests = [...tests];
        if( 0 <= index && index < newTests.length )
            newTests.splice(index, 1);
        setTests(newTests);
        setSelectedTest(0 <= index - 1 && index - 1 < newTests.length ? index - 1 : null );
    }, [tests]);

    if( !exercise )
        return <></>
    return <>
        <Box width="100%" overflow="hidden" padding={1}>
            <Typography sx={{float: 'left', marginTop: 1, marginRight: 1}}>TESTS: </Typography>
            <ToggleButtonGroup value={selectedTest} exclusive size='small' sx={{float: 'left'}}>

                {tests.map((test, index) => {
                    const currentStatus = getTestProp('status', index);
                    console.log('index:', index, 'status:', currentStatus);
                    return (<div key={index.toString()}>
                        <Badge invisible={selectedTest !== index || index < exercise.testCases.length} badgeContent={
                            <HighlightOffTwoToneIcon sx={{ color: '#515151', "&:focus,&:hover": {cursor: 'pointer'}}}
                                                     fontSize="small"
                                                     onClick={() => removeTest(index)}/>
                        }>
                        <ToggleButton value={index} id={`${index}`}
                                      onClick={() => onTestSelected(index)}
                                      sx={{float: 'left', paddingLeft: 3, paddingRight: 3}}
                                      selected={selectedTest === index}
                                      style={{color: statusToColor(currentStatus, false)}}>
                            <Typography>{index + 1}</Typography>
                        </ToggleButton>
                        </Badge>
                    </div>)}
                )}
            </ToggleButtonGroup>
            <IconButton id="add-test" sx={{float: 'left', padding: '12px'}} onClick={addTest} size="large"><Add /></IconButton>

            <Button
                variant="contained"
                color="primary"
                size='small'
                sx={{float: 'right', margin: 1}}
                onClick={onSubmitClicked}
                endIcon={<Done />}>Submit</Button>

            <Button
                variant="contained"
                color="primary"
                size='small'
                sx={{float: 'right', margin: 1}}
                onClick={handleRun}
                endIcon={<Send />}>Run</Button>
        </Box>


        {isProcessing &&
        <Box width="100%" marginTop="5%" marginBottom="5%" textAlign="center">
            <StatusTypography>Running the program...</StatusTypography>
            <CircularProgress />
        </Box>}

        <Box padding="10px">
            {submissionResult && submissionResult.status === 'Compilation error' &&
            <>
                <StatusTypography style={{color: statusColors.failed}}>{submissionResult.status}</StatusTypography>
                {submissionResult.compileResult?.message?.trim() && <Typography whiteSpace='pre-wrap'>{submissionResult.compileResult?.message}</Typography>}
                {submissionResult.compileResult?.outputs?.trim() && <Typography whiteSpace='pre-wrap'>{submissionResult.compileResult?.outputs}</Typography>}
                {submissionResult.compileResult?.errors?.trim() && <Typography whiteSpace='pre-wrap'>{submissionResult.compileResult?.errors}</Typography>}
            </>}

            {!isProcessing && !submissionResult && selectedTest === null &&
            <StatusTypography>Run the program to see the output, Submit to evaluate</StatusTypography>}

            {selectedTest !== null && selectedTest < tests.length &&
            <TestView
                testCase={tests[selectedTest]}
                message={getTestProp('message', selectedTest)}
                output={getTestProp('outputs', selectedTest)}
                error={getTestProp('errors', selectedTest)}
                readOnly={selectedTest < exercise.testCases.length}
                status={getTestProp('status', selectedTest)}
                score={getTestProp('score', selectedTest)}
                memory={getTestProp('memory', selectedTest)}
                time={getTestProp('time', selectedTest)}
                onSaveTest={(input, target) => onSaveTest(selectedTest, input, target)} />}
        </Box>
    </>;
}

export default memo(Console);

import React, {memo, useContext, useState} from "react";
import {Button, CircularProgress, FormControl, FormControlLabel, FormLabel, Grid, Checkbox, FormGroup} from "@mui/material";
import {AuthContext} from "../../App";
import {CourseContext, CurrentExerciseContext} from "../Course";
import {useStickyState} from "../../util";
import {SubmissionResult} from "models/submissions";
import {onSubmissionResultChanged, submitSolution} from "../../services/submissions";
import {LANGUAGES} from "models/language";
import {Done} from "@mui/icons-material";
import Box from "@mui/material/Box";
import {StatusTypography} from "../../common/StatusTypography";
import {statusToColor} from "../colors";

const SEP = '$#%#@!)*(&';

function Checkboxes() {
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);

    const [answer, setAnswer] =  useStickyState<string>('', `answer-${auth.currentUserId}-${exercise?.id}`);
    const [submitted, setSubmitted] = useState(false);
    const [submissionResult, setSubmissionResult] = useStickyState<SubmissionResult | null>(null, `submissionRes-${auth.currentUserId}-${exercise?.id}`);

    const onSubmit = async () => {
        if( !auth.currentUserId || !course?.id || !exercise?.id )
            return;

        setSubmitted(true);
        const submissionId = await submitSolution(auth.currentUserId, course.id, exercise.id, answer, LANGUAGES.txt, false);

        return onSubmissionResultChanged(auth.currentUserId, submissionId, result => {
            setSubmissionResult(result);
            if(result)
                setSubmitted(false);
        });
    }

    const updateAnswer = (prevItem?: string, curItem?: string) => {
        let ans = answer ? answer.split(SEP) : [];
        ans = ans.filter((val: string) => val !== prevItem && exercise?.options && exercise.options.includes(val));
        curItem && ans.push(curItem);
        ans.sort();
        ans = ans.join(SEP);
        setAnswer(ans);
    }
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if( event.target.checked )  updateAnswer(undefined, event.target.name);
        else                        updateAnswer(event.target.name);
    }
    console.log('answer:', answer);

    if( !exercise )
        return <></>
    return <>
        <Grid container direction="column" justifyContent="center" height="100%" padding={5}>

            <FormControl>
                <FormLabel>{exercise.question ?? 'The question will appear here'}</FormLabel>
                <FormGroup>
                    {exercise.options?.map(option => (
                        <FormControlLabel label={option} control={<Checkbox checked={answer.includes(option)} name={option} onChange={handleChange} />}  />
                    ))}
                </FormGroup>
            </FormControl>

            <Button
                variant="contained"
                color="primary"
                sx={{marginTop: 1, marginBottom: 1}}
                onClick={onSubmit}
                endIcon={<Done />}>Submit</Button>


            {submitted &&
                <Box width="100%" marginTop="5%" marginBottom="5%" textAlign="center">
                    <StatusTypography>Submitting the answer...</StatusTypography>
                    <CircularProgress />
                </Box>}


            {Boolean(submissionResult && submissionResult.status) &&
                <StatusTypography align="center" style={{color: statusToColor(submissionResult.status)}}>
                    {submissionResult.status}
                </StatusTypography>
            }
        </Grid>
    </>
}

export default memo(Checkboxes);

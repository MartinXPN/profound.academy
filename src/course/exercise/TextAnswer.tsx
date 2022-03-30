import React, {memo, useContext, useState} from "react";
import {Button, CircularProgress, Grid, TextField, Typography} from "@mui/material";
import {CourseContext, CurrentExerciseContext} from "../Course";
import {useStickyState} from "../../common/stickystate";
import {AuthContext} from "../../App";
import {onSubmissionResultChanged, submitSolution} from "../../services/submissions";
import {SubmissionResult} from "models/submissions";
import {LANGUAGES} from "models/language";
import {statusToColor} from "../colors";
import {StatusTypography} from "../../common/StatusTypography";
import {Done} from "@mui/icons-material";
import Box from "@mui/material/Box";


function TextAnswer() {
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

    if( !exercise )
        return <></>
    return <>
        <Grid container direction="column" justifyContent="center" height="100%" padding={5}>
            <Typography fontWeight="bold" marginBottom={1}>{exercise.question ?? 'The question will appear here'}</Typography>
            <TextField
                required multiline fullWidth variant="outlined" placeholder="Your answer goes here" label="Answer"
                value={answer} onChange={e => setAnswer(e.target.value)} />

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

export default memo(TextAnswer);

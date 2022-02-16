import {memo, useContext, useEffect, useState} from "react";
import {CircularProgress, CircularProgressProps, Grid, Typography, Box, Stack} from "@mui/material";
import {Insight} from "models/lib/courses";
import {onExerciseInsightsChanged} from "../../services/courses";
import {CourseContext, CurrentExerciseContext} from "../Course";

function CircularProgressWithLabel(props: CircularProgressProps & { value: number }) {
    return (
        <Box sx={{ position: 'relative' }}>
            <CircularProgress variant="determinate" {...props} size={100} />
            <Box sx={{
                top: 0, left: 0, bottom: 0, right: 0,
                position: 'absolute', display: 'flex', flexWrap: 'wrap', flexDirection: 'row',
                alignItems: 'center', justifyContent: 'center'
            }}>
                <Stack direction="column">
                    <Typography textAlign="center">{`${Math.round(props.value)}%`}</Typography>
                    <Typography textAlign="center" variant="caption" color="text.secondary">Success</Typography>
                </Stack>
            </Box>
        </Box>
    );
}

function Dashboard() {
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);
    const [insights, setInsights] = useState<Insight>({runs: 0, submissions: 0, solved: 0, users: 0});

    useEffect(() => {
        if( !course?.id || !exercise?.id )
            return;

        return onExerciseInsightsChanged(course.id, exercise.id, insight => setInsights(insight));
    }, [course?.id, exercise?.id]);

    const averageScore = !!insights?.totalScore && !!insights.submissions
        ? Math.round(insights.totalScore / insights.submissions)
        : 0;
    const accuracy = insights.submissions ? 100 * insights.solved / insights.submissions : 0;

    if( insights.runs === 0 && insights.submissions === 0 )
        return <></>
    return <>
        <Grid container direction="column" alignItems="center" justifyContent="center" marginTop={2}>
            <Stack direction="row" spacing={5}>
                <CircularProgressWithLabel value={accuracy} />
                <Stack direction="column">
                    <Typography>{insights.solved} &nbsp; • &nbsp; Solved</Typography>
                    <Typography>{insights.submissions} &nbsp; • &nbsp; Submissions</Typography>
                    <Typography>{insights.runs} &nbsp; • &nbsp; Runs</Typography>
                    <Typography>{averageScore} &nbsp; • &nbsp; Average score</Typography>
                </Stack>
            </Stack>
        </Grid>
    </>
}

export default memo(Dashboard);

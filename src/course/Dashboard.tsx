import React, {memo, ReactElement, useContext, useEffect, useState} from "react";
import {Stack, Grid, Typography, Box, CircularProgress} from "@mui/material";
import {Send, Person, Done, ThumbUpAlt} from "@mui/icons-material";
import {onCourseInsightsChanged} from "../services/courses";
import {CourseContext} from "./Course";
import {Insight} from "models/lib/courses";

function CourseMetricStat({title, icon, value}: {title: string, icon: ReactElement, value?: number}) {
    return <>
        <Grid container direction="column">
            <Box marginLeft="auto" marginRight="auto" textAlign="center">
                <Grid container direction="row" alignItems="center">
                    {icon} {title}
                </Grid>
            </Box>
            <Box marginLeft="auto" marginRight="auto" textAlign="center">
                {value ? <Typography variant="h5" textAlign="center">{value}</Typography> : <CircularProgress/>}
            </Box>
        </Grid>
    </>
}

function Dashboard() {
    const {course} = useContext(CourseContext);
    const [courseInsights, setCourseInsights] = useState<Insight | null>(null);

    useEffect(() => {
        if( !course?.id )
            return;

        return onCourseInsightsChanged(course.id, (insights) => setCourseInsights(insights))
    }, [course]);

    return <>
        <Stack direction="row" marginLeft="auto" marginRight="auto" marginTop={5} marginBottom={5} gap={1} maxWidth={800}>
            <CourseMetricStat title="Runs" icon={<Send fontSize="large" />} value={courseInsights?.runs} />
            <CourseMetricStat title="Submissions" icon={<Done fontSize="large" />} value={courseInsights?.submissions} />
            <CourseMetricStat title="Accepted solutions" icon={<ThumbUpAlt fontSize="large" />} value={courseInsights?.solved} />
            <CourseMetricStat title="Users" icon={<Person fontSize="large" />} value={courseInsights?.users} />
        </Stack>
    </>
}

export default memo(Dashboard);

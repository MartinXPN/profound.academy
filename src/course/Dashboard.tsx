import React, {memo, ReactElement, useContext, useEffect, useState} from "react";
import {Stack, Grid, Typography, Box, CircularProgress} from "@mui/material";
import {Send, Person, Done, ThumbUpAlt} from "@mui/icons-material";
import {onCourseInsightsChanged} from "../services/courses";
import {CourseContext} from "./Course";
import {Insight} from "models/lib/courses";
import {CartesianGrid, Line, LineChart, Tooltip, XAxis, Label} from "recharts";

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
    const data = [
        {name: 'Page A', uv: 400, pv: 1200, amt: 2400},
        {name: 'Page A', uv: 500, pv: 900, amt: 2400},
        {name: 'Page A', uv: 200, pv: 1900, amt: 2400},
        {name: 'Page B', uv: 600, pv: 888, amt: 2400},
    ];

    useEffect(() => {
        if( !course?.id )
            return;

        return onCourseInsightsChanged(course.id, (insights) => setCourseInsights(insights))
    }, [course]);

    return <>
        <Grid container direction="column" alignItems="center">
            <Grid container direction="row">
                <LineChart width={600} height={300} data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                    <XAxis dataKey="name" tick={false}>
                        <Label value="Runs" offset={0} position="insideBottom" />
                    </XAxis>
                    <Tooltip />
                    <CartesianGrid stroke="#f5f5f5" />
                    <Line type="monotone" dataKey="uv" stroke="#8884d8" yAxisId={0} />
                    <Line type="monotone" dataKey="pv" stroke="#387908" yAxisId={1} />
                </LineChart>
            </Grid>

            <Stack maxWidth="100%" width="50em" direction="row" marginTop={5} marginBottom={5} marginLeft="auto" marginRight="auto" gap={1}>
                <CourseMetricStat title="Runs" icon={<Send fontSize="large" />} value={courseInsights?.runs} />
                <CourseMetricStat title="Submissions" icon={<Done fontSize="large" />} value={courseInsights?.submissions} />
                <CourseMetricStat title="Solved" icon={<ThumbUpAlt fontSize="large" />} value={courseInsights?.solved} />
                <CourseMetricStat title="Users" icon={<Person fontSize="large" />} value={courseInsights?.users} />
            </Stack>
        </Grid>
    </>
}

export default memo(Dashboard);

import React, {memo, ReactElement, useContext, useEffect, useState} from "react";
import {Stack, Grid, Typography, Box, CircularProgress, Paper} from "@mui/material";
import {Send, Person, Done, ThumbUpAlt} from "@mui/icons-material";
import {onCourseHistoricalInsightsChanged, onCourseInsightsChanged} from "../services/courses";
import {CourseContext} from "./Course";
import {Insight} from "models/lib/courses";
import {CartesianGrid, Line, ComposedChart, Tooltip, XAxis, YAxis, Label} from "recharts";
import {statusColors} from "./colors";
import {dateDayDiff} from "../util";
import moment from "moment";
import {Payload} from "recharts/types/component/DefaultTooltipContent";

function CourseMetricStat({title, icon, value, difference}: {title: string, icon: ReactElement, value?: number, difference?: number}) {
    return <>
        <Grid container direction="column">
            <Box marginLeft="auto" marginRight="auto" textAlign="center">
                <Grid container direction="row" alignItems="center">
                    {icon} {title}
                </Grid>
            </Box>

            <Box marginLeft="auto" marginRight="auto" textAlign="center">
                <Grid container direction="row" alignItems="center">
                    {value ? <Typography variant="h5" textAlign="center">{value}</Typography> : <CircularProgress/>}
                    {difference && <Typography variant="h6" textAlign="center" noWrap sx={{color: statusColors.solved}}>&nbsp; (+{difference})</Typography>}
                </Grid>
            </Box>
        </Grid>
    </>
}

const CustomTooltip = memo(({ active, payload }: {active?: boolean, payload?: Payload<string | number, string>[]}) => {
    if( !active || !payload || payload.length === 0 )
        return null;

    const format = (date: string) => moment(date).locale('en').format('Do MMM');
    return <>
        <Paper sx={{padding: '1em'}}>
            {payload.map(p => <>
                <Typography sx={{color: p.color}}>{p.value}&nbsp; • &nbsp;{format(p.payload.date)}</Typography>
            </>)}
        </Paper>
    </>
});

const MetricChart = memo(({weekData, prevWeekData, metric, title}: {
    weekData: Insight[], prevWeekData: Insight[], metric: string, title: string
}) => {
    return <>
        <Box marginY={4}>
            <ComposedChart width={320} height={200} margin={{top: 0, right: 0, bottom: 0, left: 0}}>
                <XAxis xAxisId={0} tick={false}>
                    <Label value={title} offset={0} position="insideBottom" />
                </XAxis>
                <XAxis xAxisId={1} hide />
                <YAxis tick={false} />
                { /* @ts-ignore */ }
                <Tooltip content={({active, payload, label}) => <CustomTooltip active={active} payload={payload} label={label}/>} />
                <CartesianGrid stroke="#f5f5f5" />
                <Line data={weekData} dataKey={metric} type="monotone" stroke="#4B5FAA" xAxisId={0} />
                <Line data={prevWeekData} dataKey={metric} type="monotone" stroke="#67caff" strokeDasharray="3 3" xAxisId={1} />
            </ComposedChart>
        </Box>
    </>
});

function Dashboard() {
    const {course} = useContext(CourseContext);
    const [courseInsights, setCourseInsights] = useState<Insight | null>(null);
    const [weekCourseDailyInsights, setWeekCourseDailyInsights] = useState<Insight[]>([]);
    const [lastWeekCourseDailyInsights, setLastWeekCourseDailyInsights] = useState<Insight[]>([]);

    // Overall course insights
    useEffect(() => {
        if( !course?.id )
            return;
        return onCourseInsightsChanged(course.id, insights => setCourseInsights(insights));
    }, [course?.id]);

    // Daily course insights
    useEffect(() => {
        if( !course?.id )
            return;
        const now = new Date();
        const unsubscribeThisWeek = onCourseHistoricalInsightsChanged(course.id, dateDayDiff(now, -7), now, insights => setWeekCourseDailyInsights(insights));
        const unsubscribeLastWeek = onCourseHistoricalInsightsChanged(course.id, dateDayDiff(now, -14), dateDayDiff(now, -7), insights => setLastWeekCourseDailyInsights(insights));
        return () => {
            unsubscribeThisWeek();
            unsubscribeLastWeek();
        };
    }, [course?.id]);

    return <>
        <Grid container direction="column" alignItems="center" justifyContent="center">
            <Grid container direction="row" alignItems="center">
                <MetricChart weekData={weekCourseDailyInsights} prevWeekData={lastWeekCourseDailyInsights} metric="runs" title="Runs" />
                <MetricChart weekData={weekCourseDailyInsights} prevWeekData={lastWeekCourseDailyInsights} metric="submissions" title="Submissions" />
                <MetricChart weekData={weekCourseDailyInsights} prevWeekData={lastWeekCourseDailyInsights} metric="solved" title="Solved" />
                <MetricChart weekData={weekCourseDailyInsights} prevWeekData={lastWeekCourseDailyInsights} metric="users" title="New users" />
            </Grid>

            <Stack maxWidth="100%" width="50em" direction="row" marginY={5} marginX="auto" gap={1}>
                <CourseMetricStat title="Runs" icon={<Send fontSize="large" />} value={courseInsights?.runs} />
                <CourseMetricStat title="Submissions" icon={<Done fontSize="large" />} value={courseInsights?.submissions} />
                <CourseMetricStat title="Solved" icon={<ThumbUpAlt fontSize="large" />} value={courseInsights?.solved} />
                <CourseMetricStat title="Users" icon={<Person fontSize="large" />} value={courseInsights?.users} difference={5} />
            </Stack>
        </Grid>
    </>
}

export default memo(Dashboard);

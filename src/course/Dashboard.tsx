import {memo, ReactElement, useContext, useEffect, useState} from "react";
import {Grid, Typography, Box, Paper, Stack} from "@mui/material";
import {Send, Person, Done, ThumbUpAlt} from "@mui/icons-material";
import {onCourseHistoricalInsightsChanged, onCourseInsightsChanged} from "../services/courses";
import {CourseContext} from "./Course";
import {Insight} from "models/lib/courses";
import {CartesianGrid, Line, ComposedChart, Tooltip, XAxis, YAxis, Label, ResponsiveContainer} from "recharts";
import {dateDayDiff} from "../util";
import moment from "moment";
import {Payload} from "recharts/types/component/DefaultTooltipContent";

function CourseMetricStat({title, icon, value, difference}: {title: string, icon: ReactElement, value?: number, difference?: number}) {
    return <>
        <Grid container direction="column" sx={{padding: '2em', maxWidth: '45%'}}>
            <Box marginX="auto" textAlign="center">
                <Stack direction="row" alignItems="center">
                    <Typography variant="h4" textAlign="center">{value ?? '-'}</Typography>
                    {!!difference && difference > 0 && <Typography variant="h4" textAlign="center" color="success.light" noWrap>&nbsp; (+{difference})</Typography>}
                    {!!difference && difference < 0 && <Typography variant="h4" textAlign="center" color="error.main" noWrap>&nbsp; ({difference})</Typography>}
                </Stack>
            </Box>

            <Box marginX="auto" textAlign="center">
                <Stack direction="row" alignItems="center" gap={1}>
                    {icon}
                    <Typography>{title}</Typography>
                </Stack>
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
                <Typography sx={{color: p.color}}>{p.value}&nbsp; ??? &nbsp;{format(p.payload.date)}</Typography>
            </>)}
        </Paper>
    </>
});

const MetricChart = memo(({weekData, prevWeekData, metric, title}: {
    weekData: Insight[], prevWeekData: Insight[], metric: string, title: string
}) => {
    return <>
        <Box marginY={4} height={200} width="100%" sx={{marginLeft: -3}}>
            <ResponsiveContainer>
                <ComposedChart margin={{left: -20, right: -20}}>
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
            </ResponsiveContainer>
        </Box>
    </>
});

function Dashboard() {
    const {course} = useContext(CourseContext);
    const [courseInsights, setCourseInsights] = useState<Insight | null>(null);
    const [weekCourseDailyInsights, setWeekCourseDailyInsights] = useState<Insight[]>([]);
    const [lastWeekCourseDailyInsights, setLastWeekCourseDailyInsights] = useState<Insight[]>([]);


    const diff = (metric: string) => {
        return weekCourseDailyInsights
            // @ts-ignore
            .map(insight => insight?.[metric] ?? 0)  // - (lastWeekCourseDailyInsights[index]?.[metric] ?? 0)
            .reduce((prev, cur) => prev + cur, 0);
    }

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
        <Grid container justifyItems="center" justifyContent="center">
            <Grid item alignItems="center" sx={{ width: 300, maxWidth: '45%' }}><MetricChart weekData={weekCourseDailyInsights} prevWeekData={lastWeekCourseDailyInsights} metric="runs" title="Runs" /></Grid>
            <Grid item alignItems="center" sx={{ width: 300, maxWidth: '45%' }}><MetricChart weekData={weekCourseDailyInsights} prevWeekData={lastWeekCourseDailyInsights} metric="submissions" title="Submissions" /></Grid>
            <Grid item alignItems="center" sx={{ width: 300, maxWidth: '45%' }}><MetricChart weekData={weekCourseDailyInsights} prevWeekData={lastWeekCourseDailyInsights} metric="solved" title="Solved" /></Grid>
            <Grid item alignItems="center" sx={{ width: 300, maxWidth: '45%' }}><MetricChart weekData={weekCourseDailyInsights} prevWeekData={lastWeekCourseDailyInsights} metric="users" title="New users" /></Grid>
        </Grid>

        <Grid container justifyItems="center" justifyContent="center">
            <Grid item alignItems="center"><CourseMetricStat title="Runs" icon={<Send fontSize="large" />} value={courseInsights?.runs} difference={diff('runs')} /></Grid>
            <Grid item alignItems="center"><CourseMetricStat title="Submissions" icon={<Done fontSize="large" />} value={courseInsights?.submissions} difference={diff('submissions')} /></Grid>
            <Grid item alignItems="center"><CourseMetricStat title="Solved" icon={<ThumbUpAlt fontSize="large" />} value={courseInsights?.solved} difference={diff('solved')} /></Grid>
            <Grid item alignItems="center"><CourseMetricStat title="Users" icon={<Person fontSize="large" />} value={courseInsights?.users} difference={diff('users')} /></Grid>
        </Grid>
    </>
}

export default memo(Dashboard);

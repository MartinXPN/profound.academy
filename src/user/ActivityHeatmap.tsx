import React, {memo} from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import {Tooltip, Typography} from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import moment from "moment/moment";
import useAsyncEffect from "use-async-effect";
import {Activity} from "../models/users";
import {getUserActivity} from "../services/users";
import {useStickyState} from "../util";
import Box from "@mui/material/Box";


const useStyles = makeStyles({
    colorScale1: {fill: '#d6e685'},
    colorScale2: {fill: '#8cc665'},
    colorScale3: {fill: '#44a340'},
    colorScale4: {fill: '#1e6823'},
});


function ActivityHeatmap({userId}: {userId: string}) {
    const classes = useStyles();
    const [activity, setActivity] = useStickyState<Activity[] | null>(null, `activity-${userId}`);
    const [totalActivity, setTotalActivity] = useStickyState<number | null>(null, `totalActivity-${userId}`);

    useAsyncEffect(async () => {
        const activity = await getUserActivity(userId);
        setActivity(activity);
        setTotalActivity(activity.reduce((sum, a) => sum + a.count, 0));
    }, [userId]);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    return <>
        <Box maxWidth="100%" width="50em" marginTop="4em" marginLeft="auto" marginRight="auto">
            <CalendarHeatmap
                showMonthLabels
                startDate={startDate}
                endDate={endDate}
                values={activity ?? []}
                classForValue={(value) => {
                    if (!value || !value.count) return 'color-empty';
                    if( value.count < 3 )       return classes.colorScale1;
                    if( value.count < 6 )       return classes.colorScale2;
                    if( value.count < 9 )       return classes.colorScale3;
                    return classes.colorScale4;
                }}
                transformDayElement={(element, value, index) => {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(currentDate.getDate() + index - startDate.getDay());
                    const formattedDate = moment(currentDate).format('MMM Do, YYYY');
                    return (
                        <Tooltip key={formattedDate} describeChild title={value && value.count
                            ? `${value.count} solutions on ${formattedDate}` + ( value.count >= 10 ? '!' : '')
                            : `No solutions on ${formattedDate}`}>
                            {React.cloneElement(element)}
                        </Tooltip>);
                }}
            />
            <Typography variant="subtitle1">{totalActivity ?? '...'} solutions in the last year</Typography>
        </Box>
    </>
}

export default memo(ActivityHeatmap);

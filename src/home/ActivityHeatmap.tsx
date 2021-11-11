import React, {useContext, useState} from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import {styled} from "@mui/material/styles";
import {Tooltip, Typography} from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import moment from "moment/moment";
import {AuthContext} from "../App";
import useAsyncEffect from "use-async-effect";
import {Activity} from "../models/users";
import {getUserActivity} from "../services/users";


const useStyles = makeStyles({
    colorScale1: {fill: '#d6e685'},
    colorScale2: {fill: '#8cc665'},
    colorScale3: {fill: '#44a340'},
    colorScale4: {fill: '#1e6823'},
});

const HeatmapDiv = styled('div')(({theme}) => ({
    width: '50em',
    marginTop: '4em',
    marginLeft: 'auto',
    marginRight: 'auto',
}));



function ActivityHeatmap() {
    const classes = useStyles();
    const auth = useContext(AuthContext);
    const [activity, setActivity] = useState<Activity[]>([]);
    const [totalActivity, setTotalActivity] = useState<number | undefined>(undefined);

    useAsyncEffect(async () => {
        if( auth && auth.currentUser && auth.currentUser.uid ) {
            const activity = await getUserActivity(auth.currentUser.uid);
            setActivity(activity);
            setTotalActivity(activity.reduce((sum, a) => sum + a.count, 0));
        }
    }, [auth]);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    return <>
        <HeatmapDiv>
            <CalendarHeatmap
                showMonthLabels
                startDate={startDate}
                endDate={endDate}
                values={activity}
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
                        <Tooltip describeChild title={value && value.count
                            ? `${value.count} solutions on ${formattedDate}` + ( value.count >= 10 ? '!' : '')
                            : `No solutions on ${formattedDate}`}>
                            {React.cloneElement(element)}
                        </Tooltip>);
                }}
            />
            <Typography variant="subtitle1">{totalActivity ?? '...'} solutions in the last year</Typography>
        </HeatmapDiv>
    </>
}

export default ActivityHeatmap;

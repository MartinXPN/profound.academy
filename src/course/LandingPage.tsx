import React from "react";
import Content from "./content/Content";
import Button from "@mui/material/Button";
import makeStyles from '@mui/styles/makeStyles';
import {Course} from "../models/courses";
import Countdown from "react-countdown";
import {Typography} from "@mui/material";

interface Props {
    course: Course;
    introPageId: string;
    onStartCourseClicked: () => void;
}

const useStyles = makeStyles({
    startCourseSection: {
        textAlign: 'center',
        paddingBottom: '3em',
    },
});

function LandingPage(props: Props) {
    const classes = useStyles();
    const { introPageId, onStartCourseClicked, course } = props;


    const renderer = ({ days, hours, minutes, seconds, milliseconds, completed }:
                          {days: number, hours: number, minutes: number, seconds: number, milliseconds: number, completed: boolean}) => {
        return completed ?
            <Button color="primary" variant="contained" onClick={onStartCourseClicked}>START</Button> :
            <>
                <br/><br/><br/>
                <Typography variant="h5">Starts in</Typography>
                <Typography variant="h2">{days * 24 + hours}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')} : {milliseconds.toString().padStart(3, '0')}</Typography>
            </>;
    };

    return (
        <>
            {introPageId && <Content notionPage={introPageId} />}
            {<div className={classes.startCourseSection}>
                <Countdown
                    // @ts-ignore
                    date={course.revealsAt.toDate()}
                    intervalDelay={0}
                    precision={3}
                    renderer={renderer} />
            </div>}
        </>
    )
}

export default LandingPage;

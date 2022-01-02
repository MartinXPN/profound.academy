import React from "react";
import Content from "./Content";
import Button from "@mui/material/Button";
import {Course} from "../models/courses";
import Countdown from "react-countdown";
import {Typography} from "@mui/material";
import {styled} from "@mui/material/styles";


const CenteredContainer = styled('div')({
    textAlign: 'center',
    paddingBottom: '3em',
});

function LandingPage({introPageId, onStartCourseClicked, course}: {course: Course, introPageId: string, onStartCourseClicked: () => void}) {

    const renderer = ({ days, hours, minutes, seconds, completed }:
                          {days: number, hours: number, minutes: number, seconds: number, completed: boolean}) => {
        return completed ?
            <Button color="primary" variant="contained" onClick={onStartCourseClicked}>START</Button> :
            <>
                <br/><br/><br/>
                <Typography variant="h5">Starts in</Typography>
                <Typography variant="h2">{days * 24 + hours}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}</Typography>
            </>;
    };

    return <>
        {introPageId && <Content notionPage={introPageId} />}
        {<CenteredContainer>
            <Countdown
                date={course.revealsAt.toDate()}
                intervalDelay={0}
                precision={3}
                renderer={renderer} />
        </CenteredContainer>}
    </>
}

export default LandingPage;

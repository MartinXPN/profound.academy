import React, {useContext} from "react";
import Content from "./Content";
import Button from "@mui/material/Button";
import Countdown from "react-countdown";
import {Typography} from "@mui/material";
import {AuthContext} from "../App";
import {CourseContext} from "./Course";
import {Edit} from "@mui/icons-material";
import {useHistory, useRouteMatch} from "react-router-dom";
import Box from "@mui/material/Box";


function LandingPage({onStartCourseClicked}: {onStartCourseClicked: () => void}) {
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const history = useHistory();
    const match = useRouteMatch();

    const onEditClicked = () => {
        const url = match.url.replace(/\/$/, '');
        history.push(`${url}/edit`);
    }

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

    if( !course )
        return <></>
    return <>
        {auth.currentUserId && course.instructors.includes(auth.currentUserId) &&
            <div style={{width: '100%'}}>
            <Button variant="outlined" endIcon={<Edit />} onClick={onEditClicked} sx={{float: 'right', marginRight: '5em', marginTop: '2em'}}>
                Edit
            </Button>
            </div>
        }
        {course.introduction && <Content notionPage={course.introduction} />}
        <Box textAlign="center" paddingBottom="3em">
            <Countdown
                date={course.revealsAt.toDate()}
                intervalDelay={0}
                precision={3}
                renderer={renderer} />
        </Box>
    </>
}

export default LandingPage;

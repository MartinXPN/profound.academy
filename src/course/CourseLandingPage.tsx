import React, {useContext, memo, useEffect, useState} from "react";
import Content from "../common/notion/Content";
import Button from "@mui/material/Button";
import Countdown from "react-countdown";
import {Typography} from "@mui/material";
import {AuthContext} from "../App";
import {CourseContext} from "./Course";
import {Edit} from "@mui/icons-material";
import {useNavigate} from "react-router-dom";
import Box from "@mui/material/Box";
import {onUserInfoChanged} from "../services/users";
import {useTheme} from "@mui/material/styles";


function CourseLandingPage({onStartCourseClicked, onRegisterCourseClicked}: {
    onStartCourseClicked: () => void,
    onRegisterCourseClicked: () => void,
}) {
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const navigate = useNavigate();
    const theme = useTheme();
    const onEditClicked = () => navigate('edit');
    const [registered, setRegistered] = useState(false);
    useEffect(() => {
        if( !course?.id || !auth.currentUserId )
            return;

        return onUserInfoChanged(auth.currentUserId, user => setRegistered(!!user && !!user.courses && user.courses.filter(c => c.id === course.id).length > 0));
    }, [auth.currentUserId, course?.id]);


    const renderer = ({ days, hours, minutes, seconds, completed }:
                          {days: number, hours: number, minutes: number, seconds: number, completed: boolean}) => {
        if( completed )
            return <>
                {auth.isSignedIn && <Button color="primary" variant="contained" onClick={onStartCourseClicked}>START</Button>}
            </>
        return <>
            <br/><br/><br/>
            <Typography variant="h5">Starts in</Typography>
            <Typography variant="h2">{days * 24 + hours}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}</Typography>
            {!registered && <Button color="primary" variant="contained" onClick={onRegisterCourseClicked}>REGISTER</Button>}
            {registered && <Typography fontWeight="bold" sx={{color: theme.palette.success.light}}>Registered!</Typography>}
        </>;
    };

    if( !course )
        return <></>
    return <>
        {auth.currentUserId && course.instructors.includes(auth.currentUserId) &&
            <Box width="100%">
            <Button variant="outlined" endIcon={<Edit />} onClick={onEditClicked} sx={{float: 'right', marginRight: '5em', marginTop: '2em'}}>
                Edit
            </Button>
            </Box>
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

export default memo(CourseLandingPage);

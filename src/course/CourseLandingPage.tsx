import {useContext, memo, useEffect, useState} from "react";
import Content from "../common/notion/Content";
import Button from "@mui/material/Button";
import Countdown from "react-countdown";
import {Typography} from "@mui/material";
import {AuthContext} from "../App";
import {CourseContext} from "./Course";
import Box from "@mui/material/Box";
import {onUserInfoChanged} from "../services/users";
import {LocalizeContext} from "../common/Localization";


function CourseLandingPage({onStartCourseClicked, onRegisterCourseClicked}: {
    onStartCourseClicked: () => void,
    onRegisterCourseClicked: () => void,
}) {
    const auth = useContext(AuthContext);
    const {localize} = useContext(LocalizeContext);
    const {course} = useContext(CourseContext);
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
            <Typography variant="h2">Starts in</Typography>
            <Typography variant="h1">{days}d {hours}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}</Typography>
            {!registered && <Button color="primary" variant="contained" onClick={onRegisterCourseClicked}>REGISTER</Button>}
            {registered && <Typography fontWeight="bold" color="success.light">Registered!</Typography>}
        </>;
    };

    if( !course )
        return <></>
    return <>
        {course.introduction && <Content notionPage={localize(course.introduction)} />}
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

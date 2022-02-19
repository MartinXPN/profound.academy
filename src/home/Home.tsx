import React, {useContext, memo} from "react";
import {AuthContext} from "../App";
import ActivityHeatmap from "../user/ActivityHeatmap";
import CourseList from "../course/CourseList";

import {AppBarProfile} from "../user/Auth";
import AppBarNotifications from "../user/Notifications";
import Box from "@mui/material/Box";
import LandingPage from "./LandingPage";


function HeaderView() {
    const auth = useContext(AuthContext);

    return <>
        {!auth.isSignedIn
            ? <LandingPage />
            : <Box position="absolute" top={0} right={0} marginRight={4}>
                <AppBarNotifications />
                <AppBarProfile />
            </Box>
        }
    </>
}
const Header = memo(HeaderView);


function Home() {
    const auth = useContext(AuthContext);

    return <>
        <Header/>
        {auth?.currentUserId && <ActivityHeatmap userId={auth.currentUserId} />}
        {auth.currentUserId && <CourseList variant="userCourses" title="My Curriculum" userId={auth.currentUserId}/>}
        <CourseList variant="allCourses" title="All Courses" />
    </>
}

export default memo(Home);

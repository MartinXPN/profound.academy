import React, {useContext, memo} from "react";
import {AuthContext} from "../App";
import ActivityHeatmap from "../user/ActivityHeatmap";
import CourseList from "../course/CourseList";

import {AppBarProfile} from "../user/Auth";
import AppBarNotifications from "../user/Notifications";
import Box from "@mui/material/Box";
import LandingPage from "./LandingPage";
import Footer from "./Footer";
import {Divider} from "@mui/material";
import {Helmet} from "react-helmet-async";


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
        <Helmet>
            <html lang="en" />
            <title>Profound Academy</title>
            <meta property="og:title" content="Profound Academy"/>
            <meta name="description" content="Get in-depth knowledge through hands-on learning" />
        </Helmet>

        <Box minHeight="100vh">
            <Header/>
            {auth?.currentUserId && <ActivityHeatmap userId={auth.currentUserId} />}
            {auth.currentUserId && <CourseList variant="userCourses" title="My Curriculum" userId={auth.currentUserId}/>}
            <CourseList variant="allCourses" title="All Courses" />
        </Box>
        <Divider />
        <Footer />
    </>
}

export default memo(Home);

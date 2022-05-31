import React, {useContext} from "react";
import {LocalizeContext} from "../common/Localization";
import Head from "next/head";
import Box from "@mui/material/Box";
import ActivityHeatmap from "../user/ActivityHeatmap";
import CourseList from "../course/CourseList";
import {Divider} from "@mui/material";
import Footer from "../home/Footer";
import LandingPage from "../home/LandingPage";
import AppBarNotifications from "../user/Notifications";
import {AppBarProfile} from "../user/Auth";
import AuthContext from "../user/AuthContext";

export default function HomePage() {
    const auth = useContext(AuthContext);
    const {locale} = useContext(LocalizeContext);

    return <>
        <Head>
            <html lang={locale.substring(0, 2)} />
            <title>Profound Academy</title>
            <meta property="og:title" content="Profound Academy"/>
            <meta name="description" content="Get in-depth knowledge through hands-on interactive courses" />
        </Head>

        <Box minHeight="100vh">
            {!auth.isSignedIn
                ? <LandingPage />
                : <Box position="absolute" top={0} right={0} marginLeft="auto" marginRight={4}>
                    <AppBarNotifications />
                    <AppBarProfile />
                </Box>
            }
            {auth.currentUserId && <ActivityHeatmap userId={auth.currentUserId} />}
            {auth.currentUserId && <CourseList variant="userCourses" title="My Curriculum" userId={auth.currentUserId}/>}
            <CourseList variant="allCourses" title="All Courses" />
            <Divider />
            <Footer />
        </Box>
    </>
}

import {useContext, memo, useRef} from "react";
import {AuthContext} from "../App";
import ActivityHeatmap from "../user/ActivityHeatmap";
import CourseList from "../course/CourseList";

import {AppBarProfile} from "../user/Auth";
import AppBarNotifications from "../user/Notifications";
import Box from "@mui/material/Box";
import LandingPage from "./LandingPage";
import Footer from "./Footer";
import {Button, Divider, Typography} from "@mui/material";
import {useScreenAnalytics} from "../analytics";
import ElevationScroll from "./ElevationScroll";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import AppBarHome from "../common/AppBarHome";
import {Link} from "react-router-dom";


function Home() {
    const auth = useContext(AuthContext);
    useScreenAnalytics('home');

    const coursesRef = useRef(null);
    const pricingRef = useRef(null);
    const onHomeClicked = () => window.scrollTo({top: 0, behavior: 'smooth'});
    // @ts-ignore
    const onCoursesClicked = () => coursesRef.current.scrollIntoView({behavior: 'smooth'});
    // @ts-ignore
    const onPricingClicked = () => pricingRef.current.scrollIntoView({behavior: 'smooth'});

    return <>
        <Box minHeight="100vh">
            <ElevationScroll>
                <AppBar sx={{background: auth.isSignedIn ? '#FFFFFF' : '#0F1729'}} {...(auth.isSignedIn && {color: 'default'})}>
                    <Toolbar>
                        <AppBarHome onClick={onHomeClicked} sx={{mr: 2}} />
                        <Button onClick={onCoursesClicked} size="large" color="inherit" sx={{textTransform: 'none'}}>Courses</Button>
                        <Button onClick={onPricingClicked} size="large" color="inherit" sx={{textTransform: 'none'}}>Pricing</Button>
                        <Button component={Link} to="/about" size="large" color="inherit" sx={{textTransform: 'none'}}>About</Button>
                        <Box flexGrow={1} />
                        {auth.isSignedIn && <AppBarNotifications />}
                        <AppBarProfile />
                    </Toolbar>
                </AppBar>
            </ElevationScroll>
            <Toolbar /> {/* To place the content under the toolbar */}

            {!auth.isSignedIn && <LandingPage />}
            {auth.currentUserId && <ActivityHeatmap userId={auth.currentUserId} />}
            {auth.currentUserId && <CourseList variant="userCourses" title="My Curriculum" userId={auth.currentUserId}/>}

            <Box ref={coursesRef}>
                <CourseList variant="allCourses" title="All Courses" />
            </Box>
            <Box ref={pricingRef}>
                <Typography>PRICING!!??</Typography>
            </Box>
        </Box>
        <Divider />
        <Footer />
    </>
}

export default memo(Home);

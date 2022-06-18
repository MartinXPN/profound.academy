import {useContext, memo, useRef} from "react";
import {AuthContext} from "../App";
import ActivityHeatmap from "../user/ActivityHeatmap";
import CourseList from "../course/CourseList";

import {AppBarProfile} from "../user/Auth";
import AppBarNotifications from "../user/Notifications";
import Box from "@mui/material/Box";
import LandingPage from "./LandingPage";
import Footer from "./Footer";
import {Button, Divider} from "@mui/material";
import {useScreenAnalytics} from "../analytics";
import ElevationScroll from "./ElevationScroll";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import AppBarHome from "../common/AppBarHome";
import {Link} from "react-router-dom";
import Pricing from "./Pricing";


function Home() {
    const auth = useContext(AuthContext);
    useScreenAnalytics('home');

    const onHomeClicked = () => window.scrollTo({behavior: 'smooth', top: 0});
    const coursesRef = useRef(null);    // @ts-ignore
    const onCoursesClicked = () => window.scrollTo({ behavior: 'smooth', top: coursesRef.current.offsetTop - 70 });
    const pricingRef = useRef(null);    // @ts-ignore
    const onPricingClicked = () => window.scrollTo({ behavior: 'smooth', top: pricingRef.current.offsetTop - 70 });

    return <>
        <Box minHeight="100vh">
            <ElevationScroll>
                <AppBar color={auth.isSignedIn ? 'default' : 'secondary'} sx={{...(auth.isSignedIn && {background: 'white'})}}>
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

            {!auth.isSignedIn && <LandingPage onCoursesClicked={onCoursesClicked} onPricingClicked={onPricingClicked} />}
            {auth.currentUserId && <ActivityHeatmap userId={auth.currentUserId} />}
            {auth.currentUserId && <CourseList variant="userCourses" title="My Curriculum" userId={auth.currentUserId}/>}

            <Box ref={coursesRef}><CourseList variant="allCourses" title="All Courses" /></Box>
            <Box ref={pricingRef}><Pricing /></Box>
        </Box>
        <Divider />
        <Footer />
    </>
}

export default memo(Home);

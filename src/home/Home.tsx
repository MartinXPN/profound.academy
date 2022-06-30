import {useContext, memo, useRef, useState, MouseEvent} from "react";
import {AuthContext} from "../App";
import ActivityHeatmap from "../user/ActivityHeatmap";
import CourseList from "../course/CourseList";

import {AppBarProfile} from "../user/Auth";
import AppBarNotifications from "../user/Notifications";
import Box from "@mui/material/Box";
import Footer from "./Footer";
import {Button, Divider, Container, AppBar, Toolbar, IconButton, Menu, MenuItem, ListItemText, ListItemIcon, Typography} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import {useScreenAnalytics} from "../analytics";
import ElevationScroll from "./ElevationScroll";
import AppBarHome from "../common/AppBarHome";
import {Link} from "react-router-dom";
import Pricing from "./Pricing";
import LandingPage from "./LandingPage";
import {Info, Sell, ViewList} from "@mui/icons-material";
import HelpChat from "./HelpChat";


function Home({error}: {error?: string}) {
    const auth = useContext(AuthContext);
    useScreenAnalytics('home');

    const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
    const handleOpenNavMenu = (event: MouseEvent<HTMLElement>) => setAnchorElNav(event.currentTarget);
    const handleCloseNavMenu = () => setAnchorElNav(null);

    const onHomeClicked = () => window.scrollTo({behavior: 'smooth', top: 0});
    const coursesRef = useRef(null);    // @ts-ignore
    const onCoursesClicked = () => window.scrollTo({ behavior: 'smooth', top: coursesRef.current.offsetTop - 70 });
    const pricingRef = useRef(null);    // @ts-ignore
    const onPricingClicked = () => window.scrollTo({ behavior: 'smooth', top: pricingRef.current.offsetTop - 70 });

    return <>
        <Box minHeight="100vh">
            <ElevationScroll>
            <AppBar color={auth.isSignedIn ? 'default' : 'secondary'} sx={{...(auth.isSignedIn && {background: 'white'})}}>
            <Container maxWidth="xl">
            <Toolbar>
                <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                    <IconButton size="large" onClick={handleOpenNavMenu} color="inherit">
                        <MenuIcon />
                    </IconButton>
                    <Menu anchorEl={anchorElNav} anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
                          keepMounted transformOrigin={{vertical: 'top', horizontal: 'left'}}
                          open={Boolean(anchorElNav)} onClose={handleCloseNavMenu}
                          sx={{display: { xs: 'block', md: 'none' }}}>

                        <MenuItem key="courses" onClick={() => { handleCloseNavMenu(); onCoursesClicked(); }} sx={{paddingRight: 8}}>
                            <ListItemIcon><ViewList/></ListItemIcon>
                            <ListItemText>Courses</ListItemText>
                        </MenuItem>
                        <MenuItem key="pricing" onClick={() => { handleCloseNavMenu(); onPricingClicked(); }}>
                            <ListItemIcon><Sell/></ListItemIcon>
                            <ListItemText>Pricing</ListItemText>
                        </MenuItem>
                        <MenuItem key="about" component={Link} to="/about">
                            <ListItemIcon><Info/></ListItemIcon>
                            <ListItemText>About</ListItemText>
                        </MenuItem>
                    </Menu>
                </Box>

                <AppBarHome onClick={onHomeClicked} sx={{mr: 2}} />
                <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                    <Button onClick={onCoursesClicked} size="large" color="inherit" sx={{textTransform: 'none'}}>Courses</Button>
                    <Button onClick={onPricingClicked} size="large" color="inherit" sx={{textTransform: 'none'}}>Pricing</Button>
                    <Button component={Link} to="/about" size="large" color="inherit" sx={{textTransform: 'none'}}>About</Button>
                </Box>
                <Box flexGrow={1} />
                {auth.isSignedIn && <AppBarNotifications />}
                <AppBarProfile />
            </Toolbar>
            </Container>
            </AppBar>
            </ElevationScroll>
            <Toolbar /> {/* To place the content under the toolbar */}

            {!!error && <Box bgcolor="secondary.main"><Typography variant="h3" color="error" textAlign="center" padding={4}>{error}</Typography></Box>}
            {!auth.isSignedIn && <LandingPage onCoursesClicked={onCoursesClicked} onPricingClicked={onPricingClicked} />}
            {auth.currentUserId && <ActivityHeatmap userId={auth.currentUserId} />}
            {auth.currentUserId && <CourseList variant="userCourses" title="My Curriculum" userId={auth.currentUserId}/>}

            <Box ref={coursesRef}><CourseList variant="allCourses" title="All Courses" /></Box>
            <Box ref={pricingRef}><Pricing /></Box>

            <HelpChat />
        </Box>
        <Divider />
        <Footer />
    </>
}

export default memo(Home);

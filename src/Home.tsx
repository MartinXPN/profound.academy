import React, {useContext, useState} from "react";
import {AuthContext} from "./App";
import ActivityHeatmap from "./user/ActivityHeatmap";
import CourseList from "./course/CourseList";

import {AppBarProfile, SignIn} from "./user/Auth";
import AppBarNotifications from "./user/Notifications";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import {styled} from "@mui/material/styles";


const BigImage = styled('img')({
    display: 'block',
    width: '35em',
    maxWidth: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
});

function Header() {
    const [showSignInOptions, setShowSignInOptions] = useState(false);
    const auth = useContext(AuthContext);
    const landingPageImageURL = 'https://firebasestorage.googleapis.com/v0/b/profound-academy.appspot.com/o/images%2Fwebsite-landing.jpg?alt=media&token=a0d2a928-9de7-4886-a0ad-ca584a82b011';

    return <>
        {!auth.isSignedIn
            ? <Box alignContent="center" textAlign="center" paddingTop={4}>
                <BigImage src={landingPageImageURL} alt='Landing page cover' />
                {!showSignInOptions &&
                    <Button variant="contained" color="primary" size="large" sx={{margin: 4}}
                            onClick={() => setShowSignInOptions(true)}>GET STARTED</Button>}
                {showSignInOptions && <SignIn />}
            </Box>
            : <Box position="absolute" top={0} right={0} marginRight={4}>
                <AppBarNotifications />
                <AppBarProfile />
            </Box>
        }
    </>
}

function Home() {
    const auth = useContext(AuthContext);

    return <>
        <Header/>
        {auth?.currentUserId && <ActivityHeatmap userId={auth.currentUserId} />}
        {auth.currentUserId && <CourseList variant="userCourses" title="My Curriculum" userId={auth.currentUserId}/>}
        <CourseList variant="allCourses" title="All Courses" />
    </>
}

export default Home;

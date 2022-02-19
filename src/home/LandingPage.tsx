import React, {memo, useState} from "react";
import Button from "@mui/material/Button";
import {SignIn} from "../user/Auth";
import Box from "@mui/material/Box";
import {styled} from "@mui/material/styles";
import {Typography} from "@mui/material";

const BigImage = styled('img')({
    display: 'block',
    width: '35em',
    maxWidth: '50%',
    position: 'absolute',
    top: '5em',
    left: '5em',
});

const TopOval = styled('div')({
    backgroundColor: '#151c26',
    display: 'block',
    width: '160vw',
    height: '200vh',
    borderRadius: '50% 50% 50% 50% / 80% 80% 80% 80%',
    position: 'absolute',
    top: 0,
    right: 0,
    transform: 'translate(50%, -50%)',
    zIndex: -1,
});

function LandingPage() {
    const [showSignInOptions, setShowSignInOptions] = useState(false);
    const landingPageImageURL = 'https://firebasestorage.googleapis.com/v0/b/profound-academy.appspot.com/o/images%2Fwebsite-landing-removebg.png?alt=media&token=ebd74cb6-4eab-4ac8-87af-6ef0442ab699';

    return <>
        <Box position="relative" minHeight="100%">
            <TopOval />
            <BigImage src={landingPageImageURL} alt='Landing page cover' />
            <Box position="absolute" top="10em" right="1em" maxWidth="50%" sx={{color: 'white'}}>
                <Typography variant="h2" sx={{fontWeight: 'bold'}}>
                    Get in-depth knowledge
                </Typography>
                <Typography variant="h6" sx={{color: '#bdbdbd'}}>
                    Explore various courses that guide your journey from beginner to advanced level
                </Typography>
                <Box alignContent="center" textAlign="center" paddingTop={4}>
                    {showSignInOptions
                        ? <SignIn />
                        : <Button
                            variant="contained" color="primary" size="large" sx={{margin: 4}}
                            onClick={() => setShowSignInOptions(true)}>GET STARTED</Button>}
                </Box>
            </Box>
        </Box>
        <Box height="100vh" />
    </>
}

export default memo(LandingPage);

import React, {memo, useState} from "react";
import Button from "@mui/material/Button";
import {SignIn} from "../user/Auth";
import Box from "@mui/material/Box";
import {styled} from "@mui/material/styles";
import {Grid, Typography} from "@mui/material";


const TopOval = styled('div')(({ theme }) => ({
    background: '#151c26',
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: -1,

    [theme.breakpoints.down('md')]: {
        width: 0,
        height: 0,
    },
    [theme.breakpoints.up('md')]: {
        width: '160vw',
        height: '200vh',
        borderRadius: '50% 50% 50% 50% / 80% 80% 80% 80%',
        transform: 'translate(50%, -50%)',
    },
}));

const StartActions = styled(Grid)(({ theme }) => ({
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',

    [theme.breakpoints.down('md')]: {
        color: 'black',
    },
    [theme.breakpoints.up('md')]: {
        color: 'white',
        paddingTop: '10em',
        paddingBottom: '10em',
    },
}));


function LandingPage() {
    const [showSignInOptions, setShowSignInOptions] = useState(false);
    const landingPageImageURL = 'https://firebasestorage.googleapis.com/v0/b/profound-academy.appspot.com/o/images%2Fwebsite-landing-removebg.png?alt=media&token=ebd74cb6-4eab-4ac8-87af-6ef0442ab699';

    return <>
        <Box position="relative" minHeight="100vh" maxWidth="100vw" width="100%" overflow="hidden">
            <TopOval />
            <Grid container direction="row">
                <Grid item padding="5em" xs={9} sm={10} md={6} lg={5} xl={3}>
                    <img width="100%" src={landingPageImageURL} alt="Landing page cover"/>
                </Grid>
                <StartActions item paddingX="1em" xs={12} sm={12} md={6} lg={7} xl={9}>
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
                </StartActions>

            </Grid>
        </Box>
    </>
}

export default memo(LandingPage);

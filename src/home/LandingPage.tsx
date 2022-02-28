import React, {memo, useState} from "react";
import Button from "@mui/material/Button";
import {SignIn} from "../user/Auth";
import Box from "@mui/material/Box";
import {styled} from "@mui/material/styles";
import {Grid, Typography} from "@mui/material";
import Content from "../course/Content";


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
        width: '160%',
        height: '200%',
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


function LandingPage({error}: {error?: string}) {
    const [showSignInOptions, setShowSignInOptions] = useState(false);
    const landingPageImageURL = 'https://firebasestorage.googleapis.com/v0/b/profound-academy.appspot.com/o/images%2Fwebsite-landing-removebg.png?alt=media&token=ebd74cb6-4eab-4ac8-87af-6ef0442ab699';

    return <>
        <Box position="relative" height="50em" maxHeight="100%" width="100%" maxWidth="100vw" overflow="hidden">
            <TopOval />
            <Grid container direction="row">
                <Grid item xs={12} sm={10} md={5} lg={5} xl={4} padding="5em">
                    <img width="100%" src={landingPageImageURL} alt="Landing page cover"/>
                </Grid>
                <StartActions item xs={12} sm={12} md={7} lg={7} xl={7} paddingX="1em">
                    <Typography variant="h3" sx={{fontWeight: 'bold'}}>
                        Get in-depth knowledge
                    </Typography>
                    <Typography variant="h6" sx={{color: '#bdbdbd'}}>
                        Explore various courses that guide your journey from beginner to advanced level
                    </Typography>
                    {!!error && <Typography variant="h6" color="error">{error}</Typography>}
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

        <Content notionPage="2f7d510201724893be5679ba69e5f543" />
        <br/>
    </>
}

export default memo(LandingPage);

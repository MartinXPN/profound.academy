import {memo} from "react";
import {Button, Grid, Typography} from "@mui/material";
import Box from "@mui/material/Box";
import DiscordInvite from "./DiscordInvite";
import {ReactComponent as Product} from "../assets/product.svg";
import {ReactComponent as Moon} from "../assets/moon-stars.svg";
import practice from "../assets/practice.png";
import Feature from "./Feature";

function Header({onCoursesClicked}: {onCoursesClicked: () => void}) {
    return <>
        <Box bgcolor="secondary.main" position="relative" height={1000} maxHeight="calc(100vh - 64px)">
        <Grid container justifyContent="center" padding={8} sx={{display: 'flex'}}>
            <Grid item width="50%" padding={6}>
                <Typography variant="h1" color="white" fontSize={50} fontWeight="bold" marginY={2}>
                    In-depth hands-on interactive courses
                </Typography>
                <Typography variant="h2" color="white" fontSize={18} marginY={2}>
                    Explore tailored courses that guide your programming journey from beginner to the advanced level.
                </Typography>

                <Button onClick={onCoursesClicked} size="large" color="primary" variant="contained" sx={{textTransform: 'none', my: 2}}>Explore Courses</Button>
            </Grid>

            <Grid item width="50%">
                <Product />
            </Grid>
        </Grid>

        <Box marginLeft={10} position="absolute" bottom={-3} width={600}>
            <Moon />
        </Box>
        </Box>
    </>
}


function LandingPage({error, onCoursesClicked}: {error?: string, onCoursesClicked?: () => void}) {

    return <>
        {!!error && <Typography variant="h6" color="error">{error}</Typography>}
        {onCoursesClicked && <Header onCoursesClicked={onCoursesClicked} />}

        <Feature title="Learn through practice"
                 description="Each concept is explained through many exercises that help you master the topics.
                 You make progress my solving various challenges instead of only consuming content."
                 media={practice}
                 mediaPosition="left"/>

        <DiscordInvite />
    </>
}

export default memo(LandingPage);

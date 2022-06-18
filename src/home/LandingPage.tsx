import {memo} from "react";
import {Button, Grid, Typography} from "@mui/material";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import DiscordInvite from "./DiscordInvite";
import {ReactComponent as Product} from "../assets/product.svg";
import {ReactComponent as Moon} from "../assets/moon-stars.svg";

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
                <Container>
                    <Product />
                </Container>
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

        <Container>
            <Box sx={{ my: 2 }}>
                {[...new Array(32)]
                    .map(
                        () => `Cras mattis consectetur purus sit amet fermentum.
    Cras justo odio, dapibus ac facilisis in, egestas eget quam.
    Morbi leo risus, porta ac consectetur ac, vestibulum at eros.
    Praesent commodo cursus magna, vel scelerisque nisl consectetur et.`,
                    )
                    .join('\n')}
            </Box>
        </Container>

        <DiscordInvite />
    </>
}

export default memo(LandingPage);

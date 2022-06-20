import {lazy, memo, Suspense} from "react";
import {Box, Button, Grid, Typography} from "@mui/material";
const DiscordIcon = lazy(() => import('../assets/DiscordIcon'));

const INVITE_LINK = 'https://discord.gg/TTTEcu2Jju';

function DiscordInvite() {
    return <>
        <Box bgcolor="secondary.main">
        <Grid container direction="column" justifyContent="center" alignContent="center" alignItems="center"
              spacing={4} padding={8} marginY={4}>

            <Typography variant="h1" textAlign="center" color="white">Join the community of learners</Typography>
            <Typography textAlign="center" color="white">
                Ask and answer questions, participate in discussions, meet new people, and learn from others!
            </Typography>
            <Grid item>
                <Button href={INVITE_LINK} target="_blank" rel="noopener noreferrer"
                        size="large" sx={{textTransform: 'none'}}
                        variant="contained"
                        endIcon={<Suspense fallback={<></>}><DiscordIcon /></Suspense>}>
                    Join Discord Community
                </Button>
            </Grid>
        </Grid>
        </Box>
    </>
}

export default memo(DiscordInvite);

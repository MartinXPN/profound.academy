import {memo} from "react";
import {Box, Button, Grid, SvgIcon, Typography} from "@mui/material";
import { ReactComponent as Discord } from "../assets/discord.svg";

const INVITE_LINK = 'https://discord.gg/TTTEcu2Jju';

function DiscordInvite() {
    return <>
        <Box bgcolor="secondary.main">
        <Grid container direction="column" justifyContent="center" alignContent="center" alignItems="center"
              spacing={4} paddingY={4} paddingX={8} marginY={4}>

            <Typography variant="h1" fontSize={32} textAlign="center" color="white">Join the community of learners</Typography>
            <Typography textAlign="center" color="white">
                Ask and answer questions, participate in discussions, meet new people, and learn from others!
            </Typography>
            <Grid item>
                <Button href={INVITE_LINK} target="_blank"
                        size="large" sx={{textTransform: 'none'}}
                        variant="contained"
                        endIcon={<SvgIcon><Discord/></SvgIcon>}>
                    Join Discord Community
                </Button>
            </Grid>
        </Grid>
        </Box>
    </>
}

export default memo(DiscordInvite);

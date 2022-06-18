import {memo} from "react";
import {Typography} from "@mui/material";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import DiscordInvite from "./DiscordInvite";


function LandingPage({error}: {error?: string}) {

    return <>
        {!!error && <Typography variant="h6" color="error">{error}</Typography>}

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

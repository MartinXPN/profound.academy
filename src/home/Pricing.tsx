import {memo} from "react";
import {Container, Typography} from "@mui/material";
import Box from "@mui/material/Box";

function Pricing() {
    return <>
        <Container>
            <Typography variant="h5" textAlign="center" marginTop={5}>
                Picking the best plan for you
            </Typography>

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
    </>
}

export default memo(Pricing);

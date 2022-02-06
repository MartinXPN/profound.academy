import {Grid, Link, Typography} from "@mui/material";
import React, {memo} from "react";

function CodeForm() {
    return <>
        <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center" marginTop="5em" marginBottom="5em">
            <Typography align="center">
                An editor similar to <Link href="https://polygon.codeforces.com/" target="_blank" rel="noopener noreferrer">Codeforces-Polygon</Link> is coming soon...
            </Typography>
            <Typography align="center">You can use Test cases exercises for now that support drag&drop test cases</Typography>
        </Grid>

    </>
}

export default memo(CodeForm);

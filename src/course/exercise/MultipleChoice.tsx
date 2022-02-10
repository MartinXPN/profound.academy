import React, {memo} from "react";
import {Grid, Typography} from "@mui/material";

function MultipleChoice() {
    return <>
        <Grid container direction="column" alignItems="center" justifyContent="center" height="100%">
            <Typography align="center">
                Multiple choices are coming soon...
            </Typography>
        </Grid>
    </>
}

export default memo(MultipleChoice);

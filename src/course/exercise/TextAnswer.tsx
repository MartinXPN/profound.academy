import React, {memo} from "react";
import {Grid, Typography} from "@mui/material";

function TextAnswer() {
    return <>
        <Grid container direction="column" alignItems="center" justifyContent="center" height="100%">
            <Typography align="center">
                Text Answers are here!
            </Typography>
        </Grid>
    </>
}

export default memo(TextAnswer);

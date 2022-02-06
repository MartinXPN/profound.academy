import {Grid, Typography} from "@mui/material";
import React, {memo} from "react";

function TextAnswerForm() {
    return <>
        <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center" marginTop="5em" marginBottom="5em">
            <Typography align="center">
                An editor for short text answer questions is coming soon...
            </Typography>
        </Grid>

    </>
}

export default memo(TextAnswerForm);

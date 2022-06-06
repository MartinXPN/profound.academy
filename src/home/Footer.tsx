import {memo} from "react";
import {Grid, Button, Typography} from "@mui/material";
import {Link} from "react-router-dom";


function Footer() {
    return <>
        <Grid container justifyContent="center" alignContent="center" alignItems="center" spacing={4} paddingY={4} paddingX={8}>
            <Grid item><Typography>Copyright &copy;2022 Profound Academy</Typography></Grid>
            <Grid item><Button component={Link} variant="text" to="/about">About</Button></Grid>
            <Grid item><Button component={Link} variant="text" to="/privacy">Privacy Policy</Button></Grid>
            <Grid item><Button component={Link} variant="text" to="/terms">Terms and Conditions</Button></Grid>
        </Grid>
    </>
}

export default memo(Footer);

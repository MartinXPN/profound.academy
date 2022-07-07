import {memo} from "react";
import {Grid, Typography, Link} from "@mui/material";
import {Link as RouterLink} from "react-router-dom";


function Footer() {
    return <>
        <Grid container justifyContent="center" alignContent="center" alignItems="center" spacing={4} paddingY={4} paddingX={8}>
            <Grid item><Typography>Copyright &copy;2022 Profound Academy</Typography></Grid>
            <Grid item><Link component={RouterLink} to="/group-tutoring">Group Tutoring</Link></Grid>
            <Grid item><Link component={RouterLink} to="/faq">FAQ</Link></Grid>
            <Grid item><Link component={RouterLink} to="/about">About</Link></Grid>
            <Grid item><Link component={RouterLink} to="/privacy">Privacy Policy</Link></Grid>
            <Grid item><Link component={RouterLink} to="/terms">Terms and Conditions</Link></Grid>
        </Grid>
    </>
}

export default memo(Footer);

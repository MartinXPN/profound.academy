import {memo} from "react";
import {Grid, Typography, Link} from "@mui/material";


function Footer() {
    return <>
        <Grid container justifyContent="center" alignContent="center" alignItems="center" spacing={4} paddingY={4} paddingX={8}>
            <Grid item><Typography>Copyright &copy;2022 Profound Academy</Typography></Grid>
            <Grid item><Link href="/about">About</Link></Grid>
            <Grid item><Link href="/privacy">Privacy Policy</Link></Grid>
            <Grid item><Link href="/terms">Terms and Conditions</Link></Grid>
        </Grid>
    </>
}

export default memo(Footer);

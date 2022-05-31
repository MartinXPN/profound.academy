import {memo} from "react";
import {Grid, Typography} from "@mui/material";
import Link from "../common/Link";


function Footer() {
    return <>
        <Grid container justifyContent="center" alignContent="center" alignItems="center" spacing={4} paddingY={4} paddingX={8}>
            <Grid item><Typography>Copyright &copy;2022 Profound Academy</Typography></Grid>
            <Grid item><Link variant="body2" href="/about">About</Link></Grid>
            <Grid item><Link variant="body2" href="/privacy">Privacy Policy</Link></Grid>
            <Grid item><Link variant="body2" href="/terms">Terms and Conditions</Link></Grid>
        </Grid>
    </>
}

export default memo(Footer);

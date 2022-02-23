import {memo} from "react";
import {Grid, Link, Typography} from "@mui/material";
import {useNavigate} from "react-router-dom";


function Footer() {
    const navigate = useNavigate();
    const onAboutClicked = () => navigate('/about');
    const onPrivacyClicked = () => navigate('/privacy');
    const onTermsClicked = () => navigate('/terms');

    return <>
        <Grid container justifyContent="center" alignContent="center" alignItems="center" spacing={4} paddingY={4} paddingX={8}>
            <Grid item><Typography>Copyright &copy;2022 Profound Academy</Typography></Grid>
            <Grid item><Link component="button" variant="body2" onClick={onAboutClicked}>About</Link></Grid>
            <Grid item><Link component="button" variant="body2" onClick={onPrivacyClicked}>Privacy Policy</Link></Grid>
            <Grid item><Link component="button" variant="body2" onClick={onTermsClicked}>Terms and Conditions</Link></Grid>
        </Grid>
    </>
}

export default memo(Footer);

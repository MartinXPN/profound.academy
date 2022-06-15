import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import {Link} from "react-router-dom";
import AppBarNotifications from "./Notifications";
import {AppBarProfile} from "./Auth";
import {Button, SvgIcon, Typography} from "@mui/material";
import { ReactComponent as Logo } from "../logo.svg";

export default function ProfileAppBar() {
    return <>
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" color="default">
                <Toolbar>
                    <Button color="inherit" size="large" sx={{textTransform: 'none'}} component={Link} to="/">
                        <SvgIcon fontSize="large"><Logo/></SvgIcon>
                        <Typography fontWeight="bold" sx={{ml: 1}}>Profound Academy</Typography>
                    </Button>
                    <Typography sx={{ flexGrow: 1 }} />
                    <AppBarNotifications />
                    <AppBarProfile />
                </Toolbar>
            </AppBar>
        </Box>
    </>
}

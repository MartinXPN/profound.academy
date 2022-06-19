import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import {Link} from "react-router-dom";
import AppBarNotifications from "./Notifications";
import {AppBarProfile} from "./Auth";
import AppBarHome from "../common/AppBarHome";

export default function ProfileAppBar() {
    return <>
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" color="default">
                <Toolbar>
                    <AppBarHome component={Link} to="/"/>
                    <Box flexGrow={1} />
                    <AppBarNotifications />
                    <AppBarProfile />
                </Toolbar>
            </AppBar>
        </Box>
    </>
}

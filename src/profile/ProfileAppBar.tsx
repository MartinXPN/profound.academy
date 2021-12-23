import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import {Home} from "@mui/icons-material";
import {useHistory} from "react-router-dom";
import AppBarNotifications from "../header/Notifications";
import {AppBarProfile} from "../header/Auth";
import {Typography} from "@mui/material";

export default function ProfileAppBar() {
    const history = useHistory();
    const onHomeClicked = () => history.push('/');

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <IconButton key="home" color="inherit" onClick={onHomeClicked} size="large"><Home/></IconButton>
                    <Typography sx={{ flexGrow: 1 }} />
                    <AppBarNotifications />
                    <AppBarProfile />
                </Toolbar>
            </AppBar>
        </Box>
    );
}

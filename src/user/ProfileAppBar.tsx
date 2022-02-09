import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import {Home} from "@mui/icons-material";
import {useNavigate} from "react-router-dom";
import AppBarNotifications from "./Notifications";
import {AppBarProfile} from "./Auth";
import {Typography} from "@mui/material";

export default function ProfileAppBar() {
    const navigate = useNavigate();
    const onHomeClicked = () => navigate('/');

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

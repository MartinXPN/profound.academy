import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import {Home} from "@mui/icons-material";
import AppBarNotifications from "./Notifications";
import {AppBarProfile} from "./Auth";
import {Typography} from "@mui/material";
import {useRouter} from "next/router";

export default function ProfileAppBar() {
    const router = useRouter();
    const onHomeClicked = async () => await router.push('/');

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

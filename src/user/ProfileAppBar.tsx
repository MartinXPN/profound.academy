import {AppBar, Box, Toolbar, Container} from '@mui/material';
import AppBarNotifications from "./Notifications";
import {AppBarProfile} from "./Auth";
import AppBarHome from "../common/AppBarHome";

export default function ProfileAppBar() {
    return <>
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" color="default">
                <Container maxWidth="xl">
                    <Toolbar>
                        <AppBarHome />
                        <Box flexGrow={1} />
                        <AppBarNotifications />
                        <AppBarProfile />
                    </Toolbar>
                </Container>
            </AppBar>
        </Box>
    </>
}

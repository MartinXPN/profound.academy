import React, {memo, useCallback, useContext, useEffect, useState} from 'react';
import {Avatar, IconButton, MenuItem, ListItemIcon, ListItemText, Typography} from "@mui/material";
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Menu from '@mui/material/Menu';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import firebase from 'firebase/app';
import 'firebase/auth';
import {AuthContext} from "../App";
import {useNavigate} from "react-router-dom";

// Configure FirebaseUI.
const uiConfig = {
    // Popup signin flow rather than redirect flow.
    signInFlow: 'popup',
    // We will display Google and Facebook as auth providers.
    signInOptions: [
        {
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
            requireDisplayName: true,
        },
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        'microsoft.com',
    ],
    callbacks: {
        // Avoid redirects after sign-in.
        signInSuccessWithAuthResult: () => false,
    },
};


export const SignIn = memo(function SignIn() {
    const auth = useContext(AuthContext);

    // Listen to the Firebase Auth state and set the local state.
    useEffect(() => {
        return firebase.auth().onAuthStateChanged(auth.setCurrentUser);
    }, [auth]);

    if (!auth?.isSignedIn) {
        return (
            <div style={{left: '50%', textAlign: 'center'}}>
                <Typography variant="h6">Sign in to continue</Typography>
                <StyledFirebaseAuth uiCallback={ui => ui.disableAutoSignIn()} uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
            </div>
        );
    }

    return <></>;
});


export function AppBarProfile() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const onSignOutClicked = async () => {
        handleClose();
        await firebase.auth().signOut();
    }
    const onUserProfileClicked = useCallback(() => {
        navigate(`/users/${auth.currentUserId}`);
    }, [auth.currentUserId, navigate]);

    return <>
        <IconButton
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            edge="end"
            size="large">
            { /*@ts-ignore*/ }
            {auth.currentUser ? <Avatar src={auth.currentUser.photoURL} alt={auth.currentUser.displayName} /> : <Avatar/>}
        </IconButton>

        {
            // Rendering multiple StyledFirebaseAuth components result in https://github.com/firebase/firebaseui-web-react/issues/59
            // <MenuList autoFocusItem={open} id="menu-list-grow" style={{width: '20em'}}>
            //     <MenuItem key='sign-in'><SignIn /></MenuItem>
            // </MenuList>
        }

        {auth.currentUser && <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            PaperProps={{
                elevation: 0,
                sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.24))',
                    minWidth: '10em',
                },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>

            <MenuItem onClick={onUserProfileClicked} key='user-profile'>
                <ListItemIcon><AccountCircleIcon fontSize="medium" /></ListItemIcon>
                <ListItemText>Profile</ListItemText>
            </MenuItem>

            <MenuItem onClick={onSignOutClicked} key='sign-out'>
                <ListItemIcon><ExitToAppIcon fontSize="medium" /></ListItemIcon>
                <ListItemText>Logout</ListItemText>
            </MenuItem>
        </Menu>}
    </>;
}

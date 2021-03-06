import {memo, useCallback, useContext, useEffect, useState, MouseEvent} from 'react';
import {Avatar, IconButton, MenuItem, ListItemIcon, ListItemText, Typography, MenuList} from "@mui/material";
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Menu from '@mui/material/Menu';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import {AuthContext} from "../App";
import {useNavigate} from "react-router-dom";
import PreferredLanguage from "./PreferredLanguage";
import FirebaseAuth from "./FirebaseAuth";

// Configure FirebaseUI.
const uiConfig = {
    signInFlow: 'popup',
    signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        'microsoft.com',
        {
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
            requireDisplayName: true,
        },
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
                <FirebaseAuth uiCallback={ui => ui.disableAutoSignIn()} uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
            </div>
        );
    }

    return <></>;
});


export function AppBarProfile() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showLanguageOptions, setShowLanguageOptions] = useState(false);
    const open = Boolean(anchorEl);

    const handleMenu = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleClose = () => {
        setShowLanguageOptions(false);
        setAnchorEl(null);
    }

    const onSignOutClicked = async () => {
        handleClose();
        await firebase.auth().signOut();
    }
    const onUserProfileClicked = useCallback(() => {
        handleClose();
        navigate(`/users/${auth.currentUserId}`);
    }, [auth.currentUserId, navigate]);
    const onShowOptions = () => setShowLanguageOptions(true);


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


        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
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

            {!auth.isSignedIn && !showLanguageOptions && <MenuList
                autoFocusItem={open}
                id="menu-list-grow"
                style={{width: '20em'}}>
                    <SignIn />
                </MenuList>
            }

            {auth.isSignedIn && !showLanguageOptions && <MenuItem onClick={onUserProfileClicked} key="user-profile">
                <ListItemIcon><AccountCircleIcon fontSize="medium" /></ListItemIcon>
                <ListItemText>Profile</ListItemText>
            </MenuItem>}

            <PreferredLanguage onShowOptions={onShowOptions} onOptionSelected={handleClose} anchorEl={anchorEl} />

            {auth.isSignedIn && !showLanguageOptions && <MenuItem onClick={onSignOutClicked} key="sign-out">
                <ListItemIcon><ExitToAppIcon fontSize="medium" /></ListItemIcon>
                <ListItemText>Logout</ListItemText>
            </MenuItem>}
        </Menu>
    </>;
}

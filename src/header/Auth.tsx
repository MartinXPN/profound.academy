import React, {useContext, useEffect} from 'react';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import firebase from 'firebase/app';
import 'firebase/auth';
import {Avatar, IconButton, Menu, MenuItem, Typography} from "@material-ui/core";
import {AuthContext} from "../App";


// Configure FirebaseUI.
const uiConfig = {
    // Popup signin flow rather than redirect flow.
    signInFlow: 'popup',
    // We will display Google and Facebook as auth providers.
    signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
        // Avoid redirects after sign-in.
        signInSuccessWithAuthResult: () => false,
    },
};


export function SignIn() {
    const auth = useContext(AuthContext);

    // Listen to the Firebase Auth state and set the local state.
    useEffect(() => {
        const unregisterAuthObserver = firebase.auth().onAuthStateChanged(user => {
            auth?.setCurrentUser(user);
        });
        return () => unregisterAuthObserver(); // Make sure we un-register Firebase observers when the component unmounts.
    }, [auth]);

    if (!auth?.isSignedIn) {
        return (
            <div style={{left: '50%', textAlign: 'center'}}>
                <h3>Sign in to continue</h3>
                <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
            </div>
        );
    }

    return(<></>);
}


export function AppBarProfile() {
    const auth = useContext(AuthContext);
    const user = auth?.currentUser;

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);


    if (!user) {
        return (<Typography variant='h6'>Login to continue</Typography>);
    }

    return (<>
        {auth && (
            <div>
                <IconButton
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenu}
                    edge="end">
                    { /*@ts-ignore*/ }
                    <Avatar src={user.photoURL} alt={user.displayName} />
                </IconButton>
                <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{vertical: 'top',  horizontal: 'right'}}
                    transformOrigin={{vertical: 'top', horizontal: 'right'}}
                    keepMounted
                    open={open}
                    onClose={handleClose}>
                    <MenuItem onClick={() => {handleClose(); firebase.auth().signOut();}}>Sign Out</MenuItem>
                </Menu>
            </div>
        )}
    </>)
}

import React, {useContext, useEffect} from 'react';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import firebase from 'firebase/app';
import 'firebase/auth';
import './Auth.css';
import Button from "@material-ui/core/Button";
import {Avatar, createStyles, makeStyles, Theme} from "@material-ui/core";
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

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        margin: {
            margin: theme.spacing(1),
        },
    }),
);


interface AuthProps {
    showSignInOptions: boolean;
}


function Auth(props: AuthProps) {
    const classes = useStyles();
    const auth = useContext(AuthContext);

    // Listen to the Firebase Auth state and set the local state.
    useEffect(() => {
        const unregisterAuthObserver = firebase.auth().onAuthStateChanged(user => {
            auth?.setCurrentUser(user);
        });
        return () => unregisterAuthObserver(); // Make sure we un-register Firebase observers when the component unmounts.
    }, [auth]);

    if (!auth?.isSignedIn) {
        if(!props.showSignInOptions)
            return (<></>)
        return (
            <div className="Auth-SignIn">
                <h3>Sign in to continue</h3>
                <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
            </div>
        );
    }
    const user = firebase.auth().currentUser;
    if (!user) {
        return (<></>);
    }
    return (
        <div className="Auth-SignOut">
            <p className="Auth-Name">{user.displayName}</p>
            {
                // @ts-ignore
                <Avatar src={user.photoURL} alt={user.displayName} className={classes.margin}/>
            }
            <Button variant="outlined" onClick={() => firebase.auth().signOut()}>Sign Out</Button>
        </div>
    );
}


export default Auth;

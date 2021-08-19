import React, {useEffect, useState} from "react";
import firebase from "firebase";

import Button from "@material-ui/core/Button";
import {createStyles, makeStyles, Theme} from "@material-ui/core";

import './Header.css';
import Auth from "./Auth";


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        button: {
            margin: theme.spacing(4),
            color: 'white',
        },
    }),
);


function Header() {
    const classes = useStyles();
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [showSignInOptions, setShowSignInOptions] = useState(false);
    const landingPageImageURL = 'https://firebasestorage.googleapis.com/v0/b/profound-academy.appspot.com/o/images%2Fwebsite-landing.jpg?alt=media&token=a0d2a928-9de7-4886-a0ad-ca584a82b011';

    // Listen to the Firebase Auth state and set the local state.
    useEffect(() => {
        const unregisterAuthObserver = firebase.auth().onAuthStateChanged(user => setIsSignedIn(!!user));
        return () => unregisterAuthObserver(); // Make sure we un-register Firebase observers when the component unmounts.
    }, []);

    return (
        <>
            {!isSignedIn ?
                <div className='LandingPage'>
                    <img src={landingPageImageURL} alt='Landing page cover' className='LandingPage-Image'/>
                    {!showSignInOptions &&
                    <Button variant="contained" color="primary" size="large" className={classes.button}
                            onClick={() => setShowSignInOptions(true)}>GET STARTED</Button>}
                    {showSignInOptions && <Auth />}
                </div>
                :
                <div><Auth/></div>
            }
        </>
    )
}

export default Header;

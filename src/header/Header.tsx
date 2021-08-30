import React, {useContext, useState} from "react";

import Button from "@material-ui/core/Button";
import {createStyles, makeStyles, Theme} from "@material-ui/core";

import {AppBarProfile, SignIn} from "./Auth";
import {AuthContext} from "../App";


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            alignContent: 'center',
            textAlign: 'center',
            paddingTop: theme.spacing(4),
        },
        bigImage: {
            display: 'block',
            width: '40%',
            marginLeft: 'auto',
            marginRight: 'auto',
        },
        button: {
            margin: theme.spacing(4),
            color: 'white',
        },
        authProfile: {
            position: 'absolute',
            top: 0,
            right: 0,
            marginRight: theme.spacing(4),
        }
    }),
);

function Header() {
    const classes = useStyles();
    const [showSignInOptions, setShowSignInOptions] = useState(false);
    const auth = useContext(AuthContext);
    const landingPageImageURL = 'https://firebasestorage.googleapis.com/v0/b/profound-academy.appspot.com/o/images%2Fwebsite-landing.jpg?alt=media&token=a0d2a928-9de7-4886-a0ad-ca584a82b011';

    return (
        <>
            {!auth?.isSignedIn ?
                <div className={classes.root}>
                    <img src={landingPageImageURL} alt='Landing page cover' className={classes.bigImage} />
                    {!showSignInOptions &&
                    <Button variant="contained" color="primary" size="large" className={classes.button}
                            onClick={() => setShowSignInOptions(true)}>GET STARTED</Button>}
                    {showSignInOptions && <SignIn />}
                </div>
                :
                <div className={classes.authProfile}><AppBarProfile /></div>
            }
        </>
    )
}

export default Header;

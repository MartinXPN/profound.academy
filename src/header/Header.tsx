import React, {useContext, useState} from "react";

import Button from "@material-ui/core/Button";
import {createStyles, makeStyles, Theme} from "@material-ui/core";

import './Header.css';
import Auth from "./Auth";
import {AuthContext} from "../App";


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
    const [showSignInOptions, setShowSignInOptions] = useState(false);
    const auth = useContext(AuthContext);
    const landingPageImageURL = 'https://firebasestorage.googleapis.com/v0/b/profound-academy.appspot.com/o/images%2Fwebsite-landing.jpg?alt=media&token=a0d2a928-9de7-4886-a0ad-ca584a82b011';

    return (
        <>
            {!auth?.isSignedIn ?
                <div className='LandingPage'>
                    <img src={landingPageImageURL} alt='Landing page cover' className='LandingPage-Image'/>
                    {!showSignInOptions &&
                    <Button variant="contained" color="primary" size="large" className={classes.button}
                            onClick={() => setShowSignInOptions(true)}>GET STARTED</Button>}
                    <Auth showSignInOptions={showSignInOptions} />
                </div>
                :
                <div><Auth showSignInOptions={false}/></div>
            }
        </>
    )
}

export default Header;

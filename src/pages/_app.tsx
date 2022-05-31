import {useEffect} from "react";
import {AppProps, NextWebVitalsMetric} from 'next/app';
import Head from "next/head";
import createCache, {EmotionCache} from '@emotion/cache';
import {CacheProvider} from "@emotion/react";
import {ThemeProvider} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import '../firebase';

import {useStickyState} from "../common/stickystate";
import {updateUserInfo} from "../services/users";
import AuthContext from "../user/AuthContext";
import ErrorBoundary from "../common/ErrorBoundary";
import Localization from "../common/Localization";
import theme from "../theme";

import '../index.css';
import 'react-notion-x/src/styles.css';     //  core styles shared by all of react-notion-x
import 'katex/dist/katex.min.css';          // used for rendering equations
import 'react-calendar-heatmap/dist/styles.css';


export const reportWebVitals = (metric: NextWebVitalsMetric) => {
    console.log(metric);
};



const clientSideEmotionCache = createCache({key: 'css', prepend: true});

interface Props extends AppProps {
    emotionCache?: EmotionCache;
}
export default function BaseApp({Component, emotionCache = clientSideEmotionCache, pageProps}: Props) {
    const [currentUser, setCurrentUser] = useStickyState<firebase.User | null>(null, 'user');

    // Listen to the Firebase Auth state and set the local state.
    useEffect(() => {
        return firebase.auth().onAuthStateChanged(user => {
            console.log('auth state changed...', user);
            if( user )
                updateUserInfo(user.uid, user.displayName ?? undefined, user.photoURL ?? undefined)
                    .then(() => console.log('Successfully updated user info'));
            setCurrentUser(user);
        });
    }, [setCurrentUser]);

    return <>
        <CacheProvider value={emotionCache}>
            <Head>
                <title>Profound Academy</title>
                <meta name="viewport" content="initial-scale=1, width=device-width" />
            </Head>

            <ThemeProvider theme={theme}>
            <AuthContext.Provider value={{
                isSignedIn: !!currentUser,
                currentUser: currentUser,
                currentUserId: currentUser?.uid ?? undefined,
                setCurrentUser: setCurrentUser,
            }}>
            <ErrorBoundary>
            <Localization>
                {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
                <CssBaseline />
                <Component {...pageProps} />
            </Localization>
            </ErrorBoundary>
            </AuthContext.Provider>
            </ThemeProvider>
        </CacheProvider>
    </>
}

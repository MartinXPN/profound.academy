import React, {Suspense, createContext, lazy, useEffect} from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import './firebase';

import { ThemeProvider, StyledEngineProvider, createTheme } from '@mui/material/styles';
import { HelmetProvider } from 'react-helmet-async';

import {updateUserInfo} from "./services/users";
import {useStickyState} from "./common/stickystate";
import ErrorBoundary from './common/ErrorBoundary';
import Home from './home/Home';
import About from "./home/About";
import UserProfile from './user/UserProfile';
import Localization from "./common/Localization";
import Privacy from "./home/Privacy";
import TermsAndConditions from "./home/TermsAndConditions";
// Do not include the Course and the editor in the main bundle as they're pretty heavy
const Course = lazy(() => import('./course/Course'));
const CourseEditor = lazy(() => import('./course/CourseEditor'));


const theme = createTheme({
    palette: {
        background: {
            default: '#ffffff',
            paper: '#ffffff',
        },
        primary: {
            main: '#4B5FAA',
        },
        secondary: {
            main: '#37a4dc'
        },
        info: {
            main: '#f44336'
        }
    }
});


interface AuthContextProps {
    isSignedIn: boolean;
    currentUser: firebase.User | null;
    currentUserId?: string;
    setCurrentUser: (user: firebase.User | null) => void;
}

export const AuthContext = createContext<AuthContextProps>({
    isSignedIn: false, currentUser: null, setCurrentUser: () => {}
});


function App() {
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


    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme}>
            <AuthContext.Provider value={{
                isSignedIn: !!currentUser,
                currentUser: currentUser,
                currentUserId: currentUser?.uid ?? undefined,
                setCurrentUser: setCurrentUser,
            }}>
            <ErrorBoundary>
            <Router>
            <Localization>
            <HelmetProvider>
            <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                    <Route path="/" element={<Home/>} />
                    <Route path="/about" element={<About/>} />
                    <Route path="/privacy" element={<Privacy/>} />
                    <Route path="/terms" element={<TermsAndConditions/>} />
                    <Route path="/users/:userId" element={<UserProfile/>} />
                    <Route path="/new" element={<CourseEditor/>} />
                    <Route path=":courseId" element={<Course/>} />
                    <Route path=":courseId/*" element={<Course/>} />
                </Routes>
            </Suspense>
            </HelmetProvider>
            </Localization>
            </Router>
            </ErrorBoundary>
            </AuthContext.Provider>
            </ThemeProvider>
        </StyledEngineProvider>
    );
}

export default App;

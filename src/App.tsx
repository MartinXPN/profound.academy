import React, {createContext, useEffect} from 'react';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';

import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/analytics';
import "./firebase";

import { ThemeProvider, StyledEngineProvider, createTheme } from '@mui/material/styles';

import Home from "./Home";
import Course from "./course/Course";
import UserProfile from "./user/UserProfile";
import {updateUserInfo} from "./services/users";
import {useStickyState} from "./util";
import CourseEditor from "./course/CourseEditor";


firebase.analytics();
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

export const AuthContext = createContext<AuthContextProps>({isSignedIn: false, currentUser: null, setCurrentUser: () => {}});


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
        <Router>
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme}>
            <AuthContext.Provider value={{
                isSignedIn: !!currentUser,
                currentUser: currentUser,
                currentUserId: currentUser?.uid ?? undefined,
                setCurrentUser: setCurrentUser,
            }}>
            <Switch>
                <Route exact path="/"><Home/></Route>
                <Route exact path={'/users/:userId'}><UserProfile/></Route>
                <Route exact path={'/new'}><CourseEditor/></Route>
                <Route path={'/:courseId'}><Course/></Route>
            </Switch>
            </AuthContext.Provider>
            </ThemeProvider>
        </StyledEngineProvider>
        </Router>
    );
}

export default App;

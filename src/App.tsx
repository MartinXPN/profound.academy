import React, {createContext, useEffect, useState} from 'react';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';

import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/analytics';
import "./firebase";

import {MuiThemeProvider, createTheme} from '@material-ui/core/styles';

import Home from "./home/Home";
import Course from "./course/Course";
import './App.css';


firebase.analytics();
const theme = createTheme({
    palette: {
        primary: {
            main: '#4B5FAA',
        },
        secondary: {
            main: '#37a4dc'
        }
    }
});


interface AuthContextProps {
    isSignedIn: boolean;
    currentUser: firebase.User | null;
    setCurrentUser: (user: firebase.User | null) => void;
}

export const AuthContext = createContext<AuthContextProps | null>(null);


function App() {
    const [currentUser, setCurrentUser] = useState<firebase.User | null>(JSON.parse(localStorage.getItem('user') ?? 'null'));
    const setUser = (user: firebase.User | null) => {
        localStorage.setItem('user', JSON.stringify(user));
        setCurrentUser(user);
    }

    // Listen to the Firebase Auth state and set the local state.
    useEffect(() => {
        const unregisterAuthObserver = firebase.auth().onAuthStateChanged(setUser);
        return () => unregisterAuthObserver(); // Make sure we un-register Firebase observers when the component unmounts.
    }, []);


    return (
        <Router>
        <MuiThemeProvider theme={theme}>
        <AuthContext.Provider value={{isSignedIn: !!currentUser, currentUser: currentUser, setCurrentUser: setUser}}>
        <Switch>
            <Route exact path="/">
                <Home />
            </Route>
            <Route path={'/courses/:id'}>
                <Course />
            </Route>
        </Switch>
        </AuthContext.Provider>
        </MuiThemeProvider>
        </Router>
    );
}

export default App;
